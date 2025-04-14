"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, Filter, X } from "lucide-react";

// Components
import NavigationSideBar from "@/components/settings/NavigationSideBar";

// API functions
import { logout, getHotProducts } from "@/lib/api";

interface Product {
  title: string;
  price: number;
  quantity: number;
  carts: number;
}

interface HotProductsData {
  topProducts: Product[];
  metrics: {
    averageTicket: number;
    averagePieces: number;
    totalCarts: number;
  };
}

interface FilterParams {
  startDate: string | null;
  endDate: string | null;
  period: string;
}

export default function HotsPage() {
  const router = useRouter();
  const [ecommerceId, setEcommerceId] = useState<string | null>(null);
  const [hotProductsData, setHotProductsData] = useState<HotProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filterParams, setFilterParams] = useState<FilterParams>({
    startDate: null,
    endDate: null,
    period: 'all',
  });

  // Add a separate state for temporary filter values
  const [tempFilterParams, setTempFilterParams] = useState<FilterParams>({
    startDate: null,
    endDate: null,
    period: 'all',
  });

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setEcommerceId(tokenData.ecommerceId || null);
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  }, [router]);

  // Fetch hot products data with filters
  useEffect(() => {
    if (ecommerceId) {
      setLoading(true);
      getHotProducts({
        startDate: filterParams.startDate,
        endDate: filterParams.endDate
      })
        .then(data => {
          setHotProductsData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching hot products:', error);
          setLoading(false);
        });
    }
  }, [ecommerceId, filterParams]);

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

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setTempFilterParams(prev => ({
      ...prev,
      [field]: value,
      period: 'custom'
    }));
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value;
    let startDate = null;
    let endDate = null;

    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    if (period === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      startDate = formatDate(sevenDaysAgo);
      endDate = formatDate(today);
    } else if (period === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      startDate = formatDate(thirtyDaysAgo);
      endDate = formatDate(today);
    } else if (period === 'last90days') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(today.getDate() - 90);
      startDate = formatDate(ninetyDaysAgo);
      endDate = formatDate(today);
    }

    setTempFilterParams(prev => ({
      ...prev,
      startDate,
      endDate,
      period
    }));
  };

  const handleApplyFilters = () => {
    setFilterParams(tempFilterParams);
    setShowFilters(false);
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
            activePanel="hots"
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
                <h1 className="text-xl font-semibold">Produtos em Alta</h1>
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
          activePanel="hots"
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
              <h1 className="text-xl font-semibold">Produtos em Alta</h1>
              <div className="flex items-center gap-2">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-full transition-colors ${
                    isLightTheme
                      ? "hover:bg-gray-300 text-gray-700"
                      : "hover:bg-[#374248] text-[#aebac1]"
                  }`}
                  title="Filtros"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {hotProductsData?.metrics && [
                { title: "Ticket Médio", value: `R$ ${hotProductsData.metrics.averageTicket.toFixed(2)}` },
                { title: "Peças por Carrinho", value: hotProductsData.metrics.averagePieces.toFixed(1) },
                { title: "Total de Carrinhos", value: hotProductsData.metrics.totalCarts }
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

            {/* Products Table */}
            <div className="p-6 flex-1 overflow-auto">
              <div className={`rounded-lg shadow-sm overflow-hidden ${
                isLightTheme ? "bg-white" : "bg-[#202c33]"
              }`}>
                <table className="w-full">
                  <thead>
                    <tr className={`${
                      isLightTheme ? "bg-gray-50" : "bg-[#1f2c33]"
                    }`}>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Carrinhos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hotProductsData?.topProducts.map((product, index) => (
                      <tr key={index} className={index % 2 === 0 ? (isLightTheme ? "bg-white" : "bg-[#202c33]") : (isLightTheme ? "bg-gray-50" : "bg-[#1f2c33]")}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{product.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">R$ {product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{product.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{product.carts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Sidebar */}
        {showFilters && (
          <div
            className={`${
              isMobile
                ? "w-full"
                : "w-64 border-l"
            } ${isLightTheme ? "bg-white border-gray-300" : "bg-[#111b21] border-[#222d34]"} flex flex-col`}
          >
            {/* Filters Header */}
            <div className={`${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} p-4 flex items-center justify-between`}>
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button
                onClick={() => setShowFilters(false)}
                className={`p-2 rounded-full transition-colors ${
                  isLightTheme
                    ? "hover:bg-gray-300 text-gray-700"
                    : "hover:bg-[#374248] text-[#aebac1]"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filters Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Date Range Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Período</h3>
                  <div className="space-y-2">
                    <select
                      value={tempFilterParams.period}
                      onChange={handlePeriodChange}
                      className={`w-full p-2 rounded-md ${
                        isLightTheme
                          ? "bg-white border border-gray-300"
                          : "bg-[#2a3942] border border-[#374248]"
                      }`}
                    >
                      <option value="all">Todo o Período</option>
                      <option value="last7days">Últimos 7 dias</option>
                      <option value="last30days">Últimos 30 dias</option>
                      <option value="last90days">Últimos 90 dias</option>
                      <option value="custom">Personalizado</option>
                    </select>

                    {tempFilterParams.period === 'custom' && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <label className="block text-xs mb-1">Data Inicial</label>
                          <input
                            type="date"
                            value={tempFilterParams.startDate || ''}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                            className={`w-full p-2 rounded-md ${
                              isLightTheme
                                ? "bg-white border border-gray-300"
                                : "bg-[#2a3942] border border-[#374248]"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Data Final</label>
                          <input
                            type="date"
                            value={tempFilterParams.endDate || ''}
                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                            className={`w-full p-2 rounded-md ${
                              isLightTheme
                                ? "bg-white border border-gray-300"
                                : "bg-[#2a3942] border border-[#374248]"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Footer */}
            <div className={`${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} p-4 flex justify-end gap-2 ${isMobile ? "pb-4" : ""}`}>
              <button
                onClick={handleApplyFilters}
                className={`px-4 py-2 rounded-md ${
                  isLightTheme
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-[#00a884] text-white hover:bg-[#06cf9c]"
                }`}
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
