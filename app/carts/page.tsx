"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, Filter, X, Calendar, ShoppingCart } from "lucide-react";
import { format } from "date-fns";

// Components
import NavigationSideBar from "@/components/settings/NavigationSideBar";

// API functions
import { logout, getCartAnalytics } from "@/lib/api";

interface Product {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface Cart {
  id: string;
  created_at: string;
  recipient: string;
  user_id: string;
  user_phone: string | null;
  products: Product[];
  cartTotal: number;
  itemCount: number;
}

interface CartAnalyticsData {
  carts: Cart[];
}

interface FilterParams {
  startDate: string | null;
  endDate: string | null;
  period: string;
}

export default function CartsPage() {
  const router = useRouter();
  const [ecommerceId, setEcommerceId] = useState<string | null>(null);
  const [cartAnalyticsData, setCartAnalyticsData] = useState<CartAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCarts, setExpandedCarts] = useState<{ [key: string]: boolean }>({});

  // Filter states
  const [filterParams, setFilterParams] = useState<FilterParams>({
    startDate: null,
    endDate: null,
    period: 'all'
  });

  // Add a separate state for temporary filter values
  const [tempFilterParams, setTempFilterParams] = useState<FilterParams>({
    startDate: null,
    endDate: null,
    period: 'all'
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

  // Fetch cart analytics data with filters
  useEffect(() => {
    if (ecommerceId) {
      setLoading(true);
      getCartAnalytics({
        startDate: filterParams.startDate,
        endDate: filterParams.endDate
      })
        .then(data => {
          setCartAnalyticsData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching cart analytics:', error);
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

  const toggleCartExpansion = (cartId: string) => {
    setExpandedCarts(prev => ({
      ...prev,
      [cartId]: !prev[cartId]
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
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
            activePanel="carts"
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
                <h1 className="text-xl font-semibold">Carrinhos de Compras</h1>
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
          activePanel="carts"
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
              <h1 className="text-xl font-semibold">Carrinhos de Compras</h1>
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

            {/* Carts List */}
            <div className="p-4 md:p-6 flex-1 overflow-auto">
              <div className="space-y-4">
                {cartAnalyticsData?.carts.map(cart => (
                  <div
                    key={cart.id}
                    className={`rounded-lg shadow-sm overflow-hidden ${
                      isLightTheme ? "bg-white" : "bg-[#202c33]"
                    }`}
                  >
                    {/* Cart Header */}
                    <div
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer ${
                        isLightTheme ? "hover:bg-gray-50" : "hover:bg-[#222d34]"
                      }`}
                      onClick={() => toggleCartExpansion(cart.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <ShoppingCart className={`h-5 w-5 ${
                          isLightTheme ? "text-blue-500" : "text-[#00a884]"
                        }`} />
                        <div>
                          <h3 className="font-medium">{cart.user_phone || "Cliente"}</h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(cart.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center mt-2 md:mt-0 space-x-4">
                        <div>
                          <div className="text-xs text-gray-500">Itens</div>
                          <div className="font-medium">{cart.itemCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="font-medium">R$ {cart.cartTotal.toFixed(2)}</div>
                        </div>
                        <div className={`transition-transform transform ${expandedCarts[cart.id] ? 'rotate-180' : ''}`}>
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Cart Products (expanded) */}
                    {expandedCarts[cart.id] && (
                      <div className={`border-t ${
                        isLightTheme ? "border-gray-100" : "border-[#2a3942]"
                      }`}>
                        {/* Desktop Product List */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`${
                                isLightTheme ? "bg-gray-50" : "bg-[#1f2c33]"
                              }`}>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Preço</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Qtd</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {cart.products.map((product, productIndex) => (
                                <tr key={`${cart.id}-${product.id}-${productIndex}`} className={
                                  productIndex % 2 === 0
                                    ? (isLightTheme ? "bg-white" : "bg-[#202c33]")
                                    : (isLightTheme ? "bg-gray-50" : "bg-[#1f2c33]")
                                }>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {product.image && (
                                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                                          <Image
                                            src={product.image}
                                            alt={product.title}
                                            width={40}
                                            height={40}
                                            className="h-10 w-10 rounded-md object-cover"
                                            unoptimized
                                          />
                                        </div>
                                      )}
                                      <div className="ml-0 max-w-md truncate">
                                        {product.title}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    R$ {product.price.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {product.quantity}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    R$ {(product.price * product.quantity).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Product List */}
                        <div className="md:hidden">
                          <div className="divide-y divide-gray-200">
                            {cart.products.map((product, productIndex) => (
                              <div
                                key={`${cart.id}-${product.id}-${productIndex}`}
                                className="p-4"
                              >
                                <div className="flex space-x-3">
                                  {product.image && (
                                    <Image
                                      src={product.image}
                                      alt={product.title}
                                      width={60}
                                      height={60}
                                      className="h-[60px] w-[60px] rounded-md object-cover flex-shrink-0"
                                      unoptimized
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium mb-1">{product.title}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                                      <p>
                                        <span className="text-gray-500 mr-1">Preço:</span>
                                        R$ {product.price.toFixed(2)}
                                      </p>
                                      <p>
                                        <span className="text-gray-500 mr-1">Qtd:</span>
                                        {product.quantity}
                                      </p>
                                      <p className="font-medium">
                                        <span className="text-gray-500 mr-1">Subtotal:</span>
                                        R$ {(product.price * product.quantity).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {cartAnalyticsData?.carts.length === 0 && (
                  <div className={`p-8 text-center rounded-lg ${
                    isLightTheme ? "bg-white" : "bg-[#202c33]"
                  }`}>
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum carrinho encontrado</h3>
                    <p className="text-gray-500">
                      Não encontramos carrinhos para o período selecionado.
                    </p>
                  </div>
                )}
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
