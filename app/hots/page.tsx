"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, Filter, X, ShoppingCart, Search } from "lucide-react";

// Components
import NavigationSideBar from "@/components/settings/NavigationSideBar";

// API functions
import { logout, getHotProducts } from "@/lib/api";

interface Product {
  id: string;
  title: string;
  price: number;
  image: string | null;
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
  type: 'cart' | 'search';
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
    type: 'cart'
  });

  // Add a separate state for temporary filter values
  const [tempFilterParams, setTempFilterParams] = useState<FilterParams>({
    startDate: null,
    endDate: null,
    period: 'all',
    type: 'cart'
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
        endDate: filterParams.endDate,
        type: filterParams.type
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
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {hotProductsData?.metrics && [
                filterParams.type === 'cart'
                  ? { title: "Ticket Médio", value: `R$ ${hotProductsData.metrics.averageTicket.toFixed(2)}` }
                  : { title: "Visualizações de Produtos", value: Object.values(hotProductsData.topProducts).reduce((sum, p) => sum + p.quantity, 0) },
                {
                  title: filterParams.type === 'cart' ? "Peças por Carrinho" : "Produtos por Busca",
                  value: hotProductsData.metrics.averagePieces.toFixed(1)
                },
                {
                  title: filterParams.type === 'cart' ? "Total de Carrinhos" : "Total de Buscas",
                  value: hotProductsData.metrics.totalCarts
                }
              ].map((metric, index) => (
                <div
                  key={index}
                  className={`p-4 md:p-6 rounded-lg shadow-sm ${
                    isLightTheme ? "bg-white" : "bg-[#202c33]"
                  }`}
                >
                  <div className="text-xs md:text-sm text-gray-500 mb-1">{metric.title}</div>
                  <div className="text-xl md:text-3xl font-bold">{metric.value}</div>
                </div>
              ))}
            </div>

            {/* Table Title */}
            <div className={`px-6 py-4 border-b ${
              isLightTheme ? "border-gray-200" : "border-[#2a3942]"
            }`}>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {filterParams.type === 'cart' ? (
                  <>
                    <ShoppingCart className="h-6 w-6" />
                    <span>Adicionados ao Carrinho</span>
                  </>
                ) : (
                  <>
                    <Search className="h-6 w-6" />
                    <span>Apareceu nas Pesquisas</span>
                  </>
                )}
              </h2>
            </div>

            {/* Products Table */}
            <div className="p-6 flex-1 overflow-auto">
              <div className={`rounded-lg shadow-sm overflow-hidden ${
                isLightTheme ? "bg-white" : "bg-[#202c33]"
              }`}>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className={`${
                        isLightTheme ? "bg-gray-50" : "bg-[#1f2c33]"
                      }`}>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          {filterParams.type === 'cart' ? 'Quantidade' : 'Visualizações'}
                        </th>
                        {filterParams.type === 'cart' && (
                          <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Carrinhos</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {hotProductsData?.topProducts.map((product, index) => (
                        <tr key={product.id} className={index % 2 === 0 ? (isLightTheme ? "bg-white" : "bg-[#202c33]") : (isLightTheme ? "bg-gray-50" : "bg-[#1f2c33]")}>
                          <td className="px-6 py-6 whitespace-nowrap text-base">
                            <div className="flex items-center">
                              {product.image && (
                                <div className="flex-shrink-0 h-20 w-20 mr-4">
                                  <Image
                                    src={product.image}
                                    alt={product.title}
                                    width={80}
                                    height={80}
                                    className="h-20 w-20 rounded-md object-cover"
                                    unoptimized
                                  />
                                </div>
                              )}
                              <div className="ml-0">
                                {product.title}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap text-base text-right">
                            R$ {(product.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap text-base text-right">{product.quantity}</td>
                          {filterParams.type === 'cart' && (
                            <td className="px-6 py-6 whitespace-nowrap text-base text-right">{product.carts}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  <div className="space-y-4 p-4">
                    {hotProductsData?.topProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 rounded-lg ${
                          isLightTheme
                            ? "bg-white border border-gray-200"
                            : "bg-[#202c33] border border-[#2a3942]"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {product.image && (
                            <Image
                              src={product.image}
                              alt={product.title}
                              width={70}
                              height={70}
                              className="h-[70px] w-[70px] rounded-md object-cover flex-shrink-0"
                              unoptimized
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1 line-clamp-2">{product.title}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                              <p className="font-semibold">
                                R$ {filterParams.type === 'search'
                                  ? (product.price / 100).toFixed(2)
                                  : product.price.toFixed(2)}
                              </p>
                              <p>
                                <span className="text-gray-500 mr-1">
                                  {filterParams.type === 'cart' ? 'Qtd:' : 'Views:'}
                                </span>
                                {product.quantity}
                              </p>
                              {filterParams.type === 'cart' && (
                                <p>
                                  <span className="text-gray-500 mr-1">Carrinhos:</span>
                                  {product.carts}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                : "w-80 border-l"
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
                {/* Product Type Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Tipo de Análise</h3>
                  <div className="space-y-2">
                    <div className={`flex items-center rounded-md overflow-hidden ${
                      isLightTheme ? "bg-gray-200" : "bg-[#2a3942]"
                    }`}>
                      <button
                        onClick={() => setTempFilterParams(prev => ({ ...prev, type: 'cart' }))}
                        className={`flex-1 px-4 py-2 text-sm transition-colors ${
                          tempFilterParams.type === 'cart'
                            ? isLightTheme
                              ? "bg-blue-500 text-white"
                              : "bg-[#00a884] text-white"
                            : ""
                        }`}
                      >
                        Carrinho
                      </button>
                      <button
                        onClick={() => setTempFilterParams(prev => ({ ...prev, type: 'search' }))}
                        className={`flex-1 px-4 py-2 text-sm transition-colors ${
                          tempFilterParams.type === 'search'
                            ? isLightTheme
                              ? "bg-blue-500 text-white"
                              : "bg-[#00a884] text-white"
                            : ""
                        }`}
                      >
                        Buscados
                      </button>
                    </div>
                    <div className={`p-3 text-xs rounded-md ${
                      isLightTheme ? "bg-blue-50 text-blue-800" : "bg-[#182229] text-[#8696a0]"
                    }`}>
                      <p className="mb-2">
                        <strong>Carrinho:</strong> Mostra produtos que foram adicionados aos carrinhos dos clientes.
                      </p>
                      <p>
                        <strong>Buscados:</strong> Mostra produtos que foram exibidos durante as buscas, mesmo que não tenham sido adicionados ao carrinho. Cada produto é contado apenas uma vez por conversa.
                      </p>
                    </div>
                  </div>
                </div>

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
