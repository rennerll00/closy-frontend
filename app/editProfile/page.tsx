"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import logo from '/public/images/logo.png';
import { getUserLanguage, getLocalizedText, LocalizationStrings } from '@/lib/localization';
import { updateUser } from '@/lib/api'; // Ensure this path is correct based on your project structure

const getAddressByCep = async (zip: string) => {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
        if (!response.ok) {
            throw new Error('CEP não encontrado');
        }
        const data = await response.json();
        return {
            rua: data.logradouro,
            city: data.localidade,
            state: data.uf,
            country: 'Brasil',
        };
    } catch (error) {
        console.error('Erro ao buscar endereço pelo CEP:', error);
        return {
            rua: '',
            city: '',
            state: '',
            country: '',
        };
    }
};

interface Profile {
    name?: string;
    email?: string;
    genderCut?: string;
    age?: number;
    height?: number;
    weight?: number;
    shoeSize?: number;
    shirtSize?: string;
    pantsSize?: string;
    address?: {
        postalCode?: string;
        city?: string;
        state?: string;
        country?: string;
    };
    favoriteBrands?: string[];
}

interface ConversationMessage {
    user?: string;
    bot?: {
        "in-progress": boolean;
        message: string;
    };
}

export default function EditProfilePage() {
    const router = useRouter();
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [finishedProfile, setFinishedProfile] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [language, setLanguage] = useState<"english" | "brazilian_portuguese">("english");

    const [profile, setProfile] = useState<Profile>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);

    // Updated Questions Array with Localized Gender Options
    const questions = [
        { key: 'genderCut', question: "profileQ1", type: 'radio', options: ["cutGenderMale", "cutGenderFemale", "cutGenderOther"] },
        { key: 'age', question: "profileQ2", type: 'number' },
        { key: 'height', question: "profileQ3", type: 'number' },
        { key: 'weight', question: "profileQ4", type: 'number' },
        { key: 'shoeSize', question: "profileQ5", type: 'number' },
        { key: 'shirtSize', question: "profileQ6", type: 'radio', options: language === "english" ? ["XS", "S", "M", "L", "XL"] : ["PP", "P", "M", "G", "GG", "XG"] },
        { key: 'pantsSize', question: "profileQ7", type: 'number' },
        { key: 'address', question: "profileQ8", type: 'address' },
        { key: 'favoriteBrands', question: "profileQ9", type: 'checkbox', options: [
            "Mixed", "Carol Bassi", "Misci", "Gallerist", "De Goeye", "Cris Barros", "Vix", "Haight",
            "Birkenstock", "Alexandre Birman", "Nk Store", "Lilly Sarti", "Lenny Niemeyer", "BoBo",
            "Pat Bo", "Adriana Degreas", "Ginger", "TIG", "Hering", "Track&Field", "Live!",
            "Cia Marítima", "Animale", "Farm", "Maria Filó", "Nati Vozza", "Zen",
            "Shoulder", "Zara", "Arezzo", "Vans", "Insider"
        ] }
    ] as const;

    const initialSuggestions: (keyof LocalizationStrings)[] = ["emailConfirmYes", "emailConfirmNo"];

    // Hardcoded Brands Array (could be moved to a separate file or fetched from an API)
    const brandsList = [
        "Mixed", "Carol Bassi", "Misci", "Gallerist", "De Goeye", "Cris Barros", "Vix", "Haight",
        "Birkenstock", "Alexandre Birman", "Nk Store", "Lilly Sarti", "Lenny Niemeyer", "BoBo",
        "Pat Bo", "Adriana Degreas", "Ginger", "TIG", "Hering", "Track&Field", "Live!",
        "Cia Marítima", "Animale", "Farm", "Maria Filó", "Nati Vozza", "Zen",
        "Shoulder", "Zara", "Arezzo", "Vans", "Insider"
    ];

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedCountry = localStorage.getItem('country') || 'us';
            const userLang = getUserLanguage(storedCountry);
            setLanguage(userLang);
        }
    }, []);

    useEffect(() => {
        if (!language) return;
        const storedProfile = localStorage.getItem('profile');
        const storedEmail = localStorage.getItem('email') || '';

        if (!storedProfile || storedProfile === "{}") {
            // No profile: start fresh with email confirmation
            setConversation([
                { bot: { "in-progress": false, message: getLocalizedText(language, "profileIntro") + `"${storedEmail}"?` } }
            ]);
            setCurrentQuestionIndex(-2);
        } else {
            // Profile exists
            const parsed = JSON.parse(storedProfile) as Profile;
            setProfile(parsed);

            const loadedConversation: ConversationMessage[] = [];
            let answeredCount = 0;

            questions.forEach((q) => {
                const answer = parsed[q.key];
                if (answer !== undefined && answer !== null && answer !== "") {
                    answeredCount++;
                    loadedConversation.push({ bot: { "in-progress": false, message: getLocalizedText(language, q.question) } });
                    if (q.key === 'address' && typeof answer === 'object' && !Array.isArray(answer)) {
                        const { postalCode, city, state, country } = answer;
                        const addressString = `${postalCode} - ${city}, ${state}, ${country}`;
                        loadedConversation.push({ user: addressString });
                    } else if (Array.isArray(answer)) {
                        loadedConversation.push({ user: answer.join(', ') });
                    } else {
                        loadedConversation.push({ user: answer.toString() });
                    }
                }
            });

            setConversation(loadedConversation);

            if (answeredCount >= questions.length) {
                // All answered from localStorage: show Q&A and editProfile button (no redirect)
                setCurrentQuestionIndex(questions.length); // Indicates completion
            } else {
                // Some missing answers
                const answeredKeys = Object.keys(parsed).filter(k => parsed[k as keyof Profile] !== undefined && parsed[k as keyof Profile] !== null && parsed[k as keyof Profile] !== "");
                const nextQuestion = questions.find(q => !answeredKeys.includes(q.key));
                if (nextQuestion) {
                    const nextIndex = questions.indexOf(nextQuestion);
                    setCurrentQuestionIndex(nextIndex);
                }
            }
        }
    }, [language]);

    // Ask question whenever currentQuestionIndex changes to a question index
    useEffect(() => {
        if (currentQuestionIndex === null) return;

        // If 0 to questions.length -1: ask the corresponding question
        if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
            const qObj = questions[currentQuestionIndex];
            const nextQ = getLocalizedText(language, qObj.question);
            setConversation(prev => [...prev, { bot: { "in-progress": false, message: nextQ } } ]);
        }
    }, [currentQuestionIndex, language]);

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const finishProfile = async () => {
        const successMsg: ConversationMessage = {
            bot: { "in-progress": false, message: getLocalizedText(language, "profileSuccess") }
        };
        setConversation(prev => [...prev, successMsg]);

        // Retrieve the user ID and email from localStorage
        const id = localStorage.getItem('id'); // Ensure 'id' is stored in localStorage
        const email = localStorage.getItem('email') || '';

        if (!id && !email) {
            console.error('User ID nor email found in localStorage.');
            // Optionally, handle this error by notifying the user or redirecting
            return;
        }

        // Prepare the payload
        const payload = {
            id,
            email, // Top-level 'email' field
            profile
        };

        try {
            setIsLoading(true);
            // Call the updateUser function with the structured payload
            const updatedUser = await updateUser(payload);

            // Optionally, handle the updated user data
            console.log('User updated successfully:', updatedUser);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error updating user:', error);
            // Optionally, notify the user about the error
        } finally {
            setIsLoading(false);
            // Redirect after a short delay
            setTimeout(() => {
                router.push('/');
            }, 2000);
        }
    };

    const handleSubmit = async (e: React.FormEvent | string) => {
        if (typeof e === 'string') {
            // Handle suggestion submission
            const userResponse = e.trim();
            processUserResponse(userResponse);
        } else {
            e.preventDefault();
            if (!input.trim()) return;

            const userResponse = input.trim();
            setInput('');
            setIsLoading(false);

            await processUserResponse(userResponse);
        }
    };

    const processUserResponse = async (userResponse: string) => {
        // Show user response as typed
        setConversation(prev => [...prev, { user: userResponse } ]);

        if (currentQuestionIndex === -2) {
            // Email confirmation step
            const yesVal = getLocalizedText(language, "emailConfirmYes").toLowerCase();
            const noVal = getLocalizedText(language, "emailConfirmNo").toLowerCase();
            const userLower = userResponse.toLowerCase();

            if (userLower === yesVal) {
                // Confirmed email, go to first question
                setCurrentQuestionIndex(0);
            } else if (userLower === noVal) {
                // Not correct, ask for correct email
                setConversation(prev => [...prev, { bot: { "in-progress": false, message: getLocalizedText(language, "emailPromptCorrect") } } ]);
                setCurrentQuestionIndex(-1);
            }

        } else if (currentQuestionIndex === -1) {
            // Correct email input provided
            localStorage.setItem('email', userResponse);
            // Proceed to first question
            setConversation(prev => [...prev, { bot: { "in-progress": false, message: userResponse } } ]);
            setCurrentQuestionIndex(0);

        } else if (currentQuestionIndex !== null && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
            // Answering one of the profile questions
            const currentQ = questions[currentQuestionIndex];

            // Handle different input types
            if (currentQ.type === 'checkbox') {
                // For checkboxes, expect userResponse to be a comma-separated list
                const selectedBrands = userResponse.split(',').map(brand => brand.trim()).filter(brand => brandsList.includes(brand));
                if (selectedBrands.length === 0) {
                    setConversation(prev => [...prev, { bot: { "in-progress": false, message: getLocalizedText(language, "selectAtLeastOneBrand") } } ]);
                    return;
                }
                const updatedProfile = { ...profile, [currentQ.key]: selectedBrands };
                setProfile(updatedProfile);
                localStorage.setItem('profile', JSON.stringify(updatedProfile));

            } else if (currentQ.type === 'number') {
                const numericValue = Number(userResponse);
                if (isNaN(numericValue)) {
                    // Handle invalid number input
                    setConversation(prev => [...prev, { bot: { "in-progress": false, message: getLocalizedText(language, "invalidNumber") } } ]);
                    return;
                }
                const updatedProfile = { ...profile, [currentQ.key]: numericValue };
                setProfile(updatedProfile);
                localStorage.setItem('profile', JSON.stringify(updatedProfile));

            } else if (currentQ.type === 'radio') {
                const updatedProfile = { ...profile, [currentQ.key]: userResponse };
                setProfile(updatedProfile);
                localStorage.setItem('profile', JSON.stringify(updatedProfile));

            } else if (currentQ.type === 'address') {
                // Address is handled separately
                // The address submission should have already updated the profile and localStorage
                // Proceed to next question
                const updatedProfile = { ...profile, address: { ...profile.address } };
                setProfile(updatedProfile);
                localStorage.setItem('profile', JSON.stringify(updatedProfile));
            }

            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);

            // If we just answered the last question
            if (nextIndex === questions.length) {
                setFinishedProfile(true);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleEditProfile = () => {
        // Restart from scratch
        localStorage.setItem('profile', "{}");
        const storedEmail = localStorage.getItem('email') || '';
        setProfile({});
        setConversation([
            { bot: { "in-progress": false, message: getLocalizedText(language, "profileIntro") + `"${storedEmail}"?` } }
        ]);
        setCurrentQuestionIndex(-2);
        setInput('');
        setIsLoading(false);
    };

    const handleSuggestionClick = (suggestionKey: keyof LocalizationStrings) => {
        const suggestionText = getLocalizedText(language, suggestionKey);
        handleSubmit(suggestionText);
    };

    let currentQObj = null;
    if (currentQuestionIndex !== null && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
        currentQObj = questions[currentQuestionIndex];
    }

    const showInitialSuggestions = (currentQuestionIndex === -2);

    const answeredCount = Object.keys(profile).filter(k => profile[k as keyof Profile] !== undefined && profile[k as keyof Profile] !== null && profile[k as keyof Profile] !== "").length;

    // If all answered and we are not in the middle of finishing right now (no redirect), show editProfile button
    const shouldShowEditProfile = (currentQuestionIndex === questions.length && answeredCount >= questions.length && conversation.length > 0 && !finishedProfile);

    useEffect(() => {
        if (finishedProfile) {
            finishProfile();
        }
    }, [finishedProfile]);

    // Helper function to render input based on question type
    const renderInput = () => {
        if (!currentQObj) return null;

        switch (currentQObj.type) {
            case 'radio':
                return (
                    <div className="flex flex-col space-y-2">
                        {currentQObj.options?.map((optionKey, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition text-left"
                                onClick={() => handleSubmit(getLocalizedText(language, optionKey as keyof LocalizationStrings))}
                            >
                                {getLocalizedText(language, optionKey as keyof LocalizationStrings)}
                            </button>
                        ))}
                    </div>
                );
            case 'checkbox':
                return (
                    <div className="flex flex-col space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {brandsList.map((brand, idx) => (
                                <label key={idx} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        value={brand}
                                        onChange={(e) => {
                                            let updatedBrands = profile.favoriteBrands || [];
                                            if (e.target.checked) {
                                                updatedBrands = [...updatedBrands, brand];
                                            } else {
                                                updatedBrands = updatedBrands.filter(b => b !== brand);
                                            }
                                            setProfile({ ...profile, favoriteBrands: updatedBrands });
                                        }}
                                        checked={profile.favoriteBrands?.includes(brand) || false}
                                    />
                                    <span>{brand}</span>
                                </label>
                            ))}
                        </div>
                        <Button
                            onClick={() => {
                                const selectedBrands = profile.favoriteBrands || [];
                                if (selectedBrands.length === 0) {
                                    setConversation(prev => [...prev, { bot: { "in-progress": false, message: getLocalizedText(language, "selectAtLeastOneBrand") } } ]);
                                    return;
                                }
                                handleSubmit(selectedBrands.join(', '));
                            }}
                            className="mt-2 bg-[#f6213f] hover:bg-[#d2102c] text-white"
                        >
                            {getLocalizedText(language, "submit")}
                        </Button>
                    </div>
                );
            case 'number':
                return (
                    <div className="flex flex-row gap-2">
                        <textarea
                            onKeyDown={handleKeyDown}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={getLocalizedText(language, "profileAnswerPlaceholder")}
                            className="flex-1 bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md resize-none overflow-y-auto font-nunito font-medium"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button disabled={isLoading} type="submit" className="w-12 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#f6213f] hover:bg-[#d2102c] flex items-center justify-center mx-auto">
                                <ArrowUp className="w-6 h-6 text-white" />
                            </div>
                        </button>
                    </div>
                );
            case 'address':
                return (
                    <div className="flex flex-col space-y-2">
                        <input
                            type="text"
                            value={profile.address?.postalCode || ''}
                            onChange={async (e) => {
                                const newPostalCode = e.target.value;
                                setProfile({
                                    ...profile,
                                    address: {
                                        ...profile.address,
                                        postalCode: newPostalCode,
                                        city: profile.address?.city || '',
                                        state: profile.address?.state || '',
                                        country: profile.address?.country || ''
                                    }
                                });

                                if (newPostalCode.length === 8) { // Assuming Brazilian CEP has 8 digits
                                    const addressData = await getAddressByCep(newPostalCode);
                                    if (addressData.city && addressData.state && addressData.country) {
                                        setProfile(prevProfile => ({
                                            ...prevProfile,
                                            address: {
                                                ...prevProfile.address,
                                                city: addressData.city,
                                                state: addressData.state,
                                                country: addressData.country,
                                                postalCode: newPostalCode // Ensure postalCode is always a string
                                            }
                                        }));
                                    }
                                }
                            }}
                            placeholder={getLocalizedText(language, "postalCode")}
                            className="bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md font-nunito font-medium"
                            maxLength={8}
                        />
                        <input
                            type="text"
                            value={profile.address?.city || ''}
                            onChange={(e) => setProfile({
                                ...profile,
                                address: {
                                    ...profile.address,
                                    city: e.target.value,
                                    postalCode: profile.address?.postalCode || '',
                                    state: profile.address?.state || '',
                                    country: profile.address?.country || ''
                                }
                            })}
                            placeholder={getLocalizedText(language, "city")}
                            className="bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md font-nunito font-medium"
                            disabled={profile.address?.city !== ''}
                        />
                        <input
                            type="text"
                            value={profile.address?.state || ''}
                            onChange={(e) => setProfile({
                                ...profile,
                                address: {
                                    ...profile.address,
                                    state: e.target.value,
                                    postalCode: profile.address?.postalCode || '',
                                    city: profile.address?.city || '',
                                    country: profile.address?.country || ''
                                }
                            })}
                            placeholder={getLocalizedText(language, "state")}
                            className="bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md font-nunito font-medium"
                            disabled={profile.address?.state !== ''}
                        />
                        <input
                            type="text"
                            value={profile.address?.country || ''}
                            onChange={(e) => setProfile({
                                ...profile,
                                address: {
                                    ...profile.address,
                                    country: e.target.value,
                                    postalCode: profile.address?.postalCode || '',
                                    city: profile.address?.city || '',
                                    state: profile.address?.state || ''
                                }
                            })}
                            placeholder={getLocalizedText(language, "countrySelect")}
                            className="bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md font-nunito font-medium"
                            disabled={profile.address?.country !== ''}
                        />
                        <Button
                            onClick={() => {
                                // Validate all address fields are filled
                                const { postalCode, city, state, country } = profile.address || {};
                                if (!postalCode || !city || !state || !country) {
                                    setConversation(prev => [...prev, { bot: { "in-progress": false, message: `${postalCode} - ${city}, ${state}, ${country}`} } ]);
                                    return;
                                }
                                handleSubmit(""); // Passing empty string as address is already saved
                            }}
                            className="bg-[#f6213f] hover:bg-[#d2102c] text-white"
                        >
                            {getLocalizedText(language, "submit")}
                        </Button>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-row gap-2">
                        <textarea
                            onKeyDown={handleKeyDown}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={getLocalizedText(language, "profileAnswerPlaceholder")}
                            className="flex-1 bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md resize-none overflow-y-auto font-nunito font-medium"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button disabled={isLoading} type="submit" className="w-12 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#f6213f] hover:bg-[#d2102c] flex items-center justify-center mx-auto">
                                <ArrowUp className="w-6 h-6 text-white" />
                            </div>
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col min-h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
            <div className="relative inline-block text-center p-4 border-b border-gray-200">
                <Image
                    src={logo}
                    alt="Logo"
                    width={80}
                    height={20}
                    className="object-contain mx-auto cursor-pointer"
                    onClick={() => router.replace('/')}
                    unoptimized
                />
            </div>

            {/* Updated padding-bottom to be dynamic or larger to accommodate growing content */}
            <div className={`flex-1 p-4 ${!shouldShowEditProfile ? 'pb-80' : 'pb-20'} overflow-y-auto`}>
                <div className="max-w-4xl mx-auto space-y-6 mt-0">
                    {conversation.map((message, i) => (
                        <div
                            key={i}
                            className={message.user ? "flex justify-end" : "flex justify-start"}
                        >
                            <div className={
                                message.user
                                    ? "p-4 bg-[#f6213f]/30 text-gray-800 max-w-[80%] font-nunito font-medium rounded-lg"
                                    : "p-4 bg-white shadow-sm max-w-[80%] font-nunito font-medium rounded-lg"
                            }>
                                {message.user || (message.bot && message.bot.message)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-4 justify-start p-4">
                            <div className="relative w-12 h-12 md:w-12 md:h-12 flex-shrink-0">
                                <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-ping" />
                                <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-spin" />
                                <Sparkles className="absolute inset-0 w-5 h-5 md:w-6 md:h-6 text-[#f6213f] m-auto" />
                            </div>
                            <span className="text-gray-500 text-base md:text-lg font-medium font-nunito flex-1">
                                {getLocalizedText(language, "thinking")}
                            </span>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Current Question Input */}
            {(currentQuestionIndex !== null && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-3xl mx-auto">
                        {renderInput()}
                    </form>
                </div>
            )}

            {/* Email Confirmation Input */}
            {(currentQuestionIndex === -2 || currentQuestionIndex === -1) && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-3xl mx-auto">
                        {currentQuestionIndex === -2 && showInitialSuggestions && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {initialSuggestions.map((suggestionKey, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className="px-3 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300 transition"
                                        onClick={() => handleSuggestionClick(suggestionKey)}
                                    >
                                        {getLocalizedText(language, suggestionKey)}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex flex-row gap-2">
                            <textarea
                                onKeyDown={handleKeyDown}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={getLocalizedText(language, "profileAnswerPlaceholder")}
                                className="flex-1 bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md resize-none overflow-y-auto font-nunito font-medium"
                                rows={1}
                                disabled={currentQuestionIndex === -2 || isLoading}
                            />
                            <button
                                disabled={currentQuestionIndex === -2 || isLoading}
                                type="submit"
                                className={`w-12 flex items-center justify-center ${currentQuestionIndex === -2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-[#f6213f] hover:bg-[#d2102c] flex items-center justify-center mx-auto">
                                    <ArrowUp className="w-6 h-6 text-white" />
                                </div>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Profile Button */}
            {shouldShowEditProfile && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-center">
                    <Button onClick={handleEditProfile} className="bg-[#f6213f] hover:bg-[#d2102c] text-white font-nunito font-medium">
                        {getLocalizedText(language, "redoProfile")}
                    </Button>
                </div>
            )}
        </div>
    )
}