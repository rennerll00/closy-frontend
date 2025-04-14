"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, Filter } from "lucide-react";

// Components
import NavigationSideBar from "@/components/settings/NavigationSideBar";

// API functions
import { logout, getLast24Analytics, getSellersByEcommerce } from "@/lib/api";

interface Last24Data {
  totalConversations: number;
  ongoingConversations: number;
  confirmedOrders: number;
  paymentLinksSent: number;
  humanInterventions: number;
}

interface Seller {
  id: string;
  name: string;
}

export default function Last24Page() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [ecommerceId, setEcommerceId] = useState<string | null>(null);
  const [last24Data, setLast24Data] = useState<Last24Data | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setSellerId(tokenData.sellerId || "default-seller");
        setUserRole(tokenData.role || null);
        setEcommerceId(tokenData.ecommerceId || null);
      } catch (error) {
        console.error("Error parsing token:", error);
        setSellerId("default-seller");
      }
    }
  }, [router]);

  // Fetch sellers for admin users
  useEffect(() => {
    if (userRole === 'ADMIN' && ecommerceId) {
      getSellersByEcommerce(ecommerceId)
        .then(data => {
          setSellers([
            { id: 'all', name: 'Todos os vendedores' },
            ...data.map(seller => ({
              id: seller.id,
              name: seller.name || 'Vendedor sem nome'
            }))
          ]);
        })
        .catch(error => {
          console.error('Error fetching sellers:', error);
          setSellers([
            { id: 'all', name: 'Todos os vendedores' },
            { id: sellerId || '', name: 'Você' }
          ]);
        });
    }
  }, [userRole, ecommerceId, sellerId]);

  // Fetch last24 data
  useEffect(() => {
    if (sellerId) {
      setLoading(true);
      getLast24Analytics({
        sellerId: userRole === 'ADMIN' ? selectedSeller : undefined
      })
        .then(data => {
          setLast24Data(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching last24 data:', error);
          setLoading(false);
        });
    }
  }, [sellerId, userRole, selectedSeller]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Theme state and toggle
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'light' : true;
    }
    return true;
  });
  const toggleTheme = () => {
    setIsLightTheme((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'light' : 'dark');
      return newTheme;
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSeller(e.target.value);
  };

  if (loading) {
    return (
      <div className={`${isLightTheme ? "bg-gray-50 text-black" : "bg-[#0b141a] text-[#e9edef]"} flex flex-col h-screen w-screen overflow-hidden`}>
        {/* TOP NAV BAR (only on desktop) */}
        {!isMobile && (
          <div className="relative flex items-center justify-between p-4 border-b border-[#222d34] bg-[#202c33] text-white">
            <div className="w-24"></div> {/* Empty div for balance */}
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={100}
              height={40}
              className="mx-auto cursor-pointer object-contain"
              onClick={() => router.replace("/")}
              unoptimized
            />
            <div className="w-24 flex justify-end">
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-md bg-[#3a4a54] hover:bg-[#4a5c66] text-sm font-medium transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT: Navigation + Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Navigation sidebar */}
          <NavigationSideBar
            activePanel="last24"
            setActivePanel={() => {}}
            isMobile={isMobile}
            isLightTheme={isLightTheme}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
          />

          {/* Content area with loading spinner */}
          <div className={`flex-1 ${isMobile ? "pb-16" : ""}`}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className={`${isLightTheme ? "bg-white" : "bg-[#202c33]"} p-4 flex items-center justify-between border-b border-[#222d34]`}>
                <h1 className="text-xl font-semibold">Últimas 24 Horas</h1>
                {userRole === 'ADMIN' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSeller}
                      onChange={handleSellerChange}
                      className={`p-2 rounded-md ${
                        isLightTheme
                          ? "bg-white border border-gray-300"
                          : "bg-[#2a3942] border border-[#374248]"
                      }`}
                    >
                      {sellers.map(seller => (
                        <option key={seller.id} value={seller.id}>
                          {seller.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Loading spinner */}
              <div className="flex-1 flex items-center justify-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
                  isLightTheme ? "border-blue-500" : "border-[#00a884]"
                }`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isLightTheme ? "bg-gray-50 text-black" : "bg-[#0b141a] text-[#e9edef]"} flex flex-col h-screen w-screen overflow-hidden`}>
      {/* TOP NAV BAR (only on desktop) */}
      {!isMobile && (
        <div className="relative flex items-center justify-between p-4 border-b border-[#222d34] bg-[#202c33] text-white">
          <div className="w-24"></div> {/* Empty div for balance */}
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={100}
            height={40}
            className="mx-auto cursor-pointer object-contain"
            onClick={() => router.replace("/")}
            unoptimized
          />
          <div className="w-24 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-md bg-[#3a4a54] hover:bg-[#4a5c66] text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT: Navigation + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation sidebar */}
        <NavigationSideBar
          activePanel="last24"
          setActivePanel={() => {}}
          isMobile={isMobile}
          isLightTheme={isLightTheme}
          toggleTheme={toggleTheme}
          handleLogout={handleLogout}
        />

        {/* Content area */}
        <div className={`flex-1 ${isMobile ? "pb-16" : ""}`}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`${isLightTheme ? "bg-white" : "bg-[#202c33]"} p-4 flex items-center justify-between border-b border-[#222d34]`}>
              <h1 className="text-xl font-semibold">Últimas 24 Horas</h1>
              {userRole === 'ADMIN' && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSeller}
                    onChange={handleSellerChange}
                    className={`p-2 rounded-md ${
                      isLightTheme
                        ? "bg-white border border-gray-300"
                        : "bg-[#2a3942] border border-[#374248]"
                    }`}
                  >
                    {sellers.map(seller => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Analytics Cards */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {last24Data && [
                { title: "Conversas em Andamento", value: last24Data.ongoingConversations },
                { title: "Pedidos Confirmados", value: last24Data.confirmedOrders },
                { title: "Links Enviados", value: last24Data.paymentLinksSent },
                { title: "Atendimento Humano", value: last24Data.humanInterventions }
              ].map((metric, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg shadow-sm ${
                    isLightTheme ? "bg-white" : "bg-[#202c33]"
                  }`}
                >
                  <div className="text-sm text-gray-500 mb-1">{metric.title}</div>
                  <div className="text-3xl font-bold">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
