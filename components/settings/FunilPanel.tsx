import { Filter, X, RotateCw, Percent, Hash, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { getFunilAnalytics, getSellersByEcommerce } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

interface FunilPanelProps {
  isLightTheme: boolean;
  isMobile: boolean;
  sellerId: string;
  userRole?: string;
  ecommerceId?: string;
  handleBack?: () => void;
}

interface FunilData {
  totalConversations: number;
  activeConversations: number;
  passiveConversations: number;
  productSearches: number;
  cart: number;
  confirmedOrders: number;
  paymentLinksSent: number;
}

interface FilterParams {
  is_passive: boolean | null;
  startDate: string | null;
  endDate: string | null;
  period: string;
  sellerId?: string;
}

interface Seller {
  id: string;
  sellerId?: string; // Some APIs might return id as 'sellerId'
  name: string;
  email?: string;
  role?: string;
}

export default function FunilPanel({ isLightTheme, isMobile, sellerId, userRole, ecommerceId, handleBack }: FunilPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = userRole === 'ADMIN';

  const [showFilters, setShowFilters] = useState(false);
  const [funilData, setFunilData] = useState<FunilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBars, setShowBars] = useState(false);
  const [showPercentage, setShowPercentage] = useState(true);
  const [sellers, setSellers] = useState<Array<{id: string, name: string}>>([]);

  // Filter states
  const [filterParams, setFilterParams] = useState<FilterParams>({
    is_passive: null,
    startDate: null,
    endDate: null,
    period: 'all',
    sellerId: isAdmin ? 'all' : sellerId,
  });

  // Add a separate state for temporary filter values
  const [tempFilterParams, setTempFilterParams] = useState<FilterParams>({
    is_passive: null,
    startDate: null,
    endDate: null,
    period: 'all',
    sellerId: isAdmin ? 'all' : sellerId,
  });

  // Fetch sellers for the admin dropdown
  useEffect(() => {
    if (isAdmin && ecommerceId) {
      // Fetch sellers from the API
      getSellersByEcommerce(ecommerceId)
        .then(data => {
          // Create seller options array
          const sellerOptions = [
            { id: 'all', name: 'Todos os vendedores' },
            // Map received sellers to the correct format
            ...data.map((seller: Seller) => ({
              id: seller.id || seller.sellerId,
              name: seller.name || 'Vendedor sem nome'
            }))
          ];

          // Check if current user is in the list, if not add them
          const currentUserInList = sellerOptions.some(s => s.id === sellerId);
          if (!currentUserInList && sellerId !== 'all') {
            sellerOptions.push({ id: sellerId, name: 'Você' });
          }

          setSellers(sellerOptions);
        })
        .catch(error => {
          console.error('Error fetching sellers:', error);
          // Fallback to default sellers if API fails
          setSellers([
            { id: 'all', name: 'Todos os vendedores' },
            { id: sellerId, name: 'Você' }
          ]);
        });
    }
  }, [isAdmin, ecommerceId, sellerId]);

  // Parse URL params on initial load
  useEffect(() => {
    const is_passive = searchParams.get('is_passive');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sellerIdParam = searchParams.get('sellerId');

    console.log('URL params detected:', { is_passive, startDate, endDate, sellerId: sellerIdParam });

    const newParams = {
      is_passive: is_passive === 'true' ? true : is_passive === 'false' ? false : null,
      startDate: startDate || null,
      endDate: endDate || null,
      period: startDate && endDate ? 'custom' : 'all',
      sellerId: isAdmin ? (sellerIdParam || 'all') : sellerId,
    };

    console.log('New filter params set from URL:', newParams);
    setFilterParams(newParams);
    setTempFilterParams(newParams);
  }, [searchParams, sellerId, isAdmin]);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      // Reset bars before fetching new data
      setShowBars(false);
      // Pass the filter params to the API
      console.log('Fetching data with filters:', JSON.stringify(filterParams));

      // Use the simplified API call
      const data = await getFunilAnalytics({
        is_passive: filterParams.is_passive,
        startDate: filterParams.startDate,
        endDate: filterParams.endDate,
        sellerId: isAdmin && filterParams.sellerId !== 'all' ? filterParams.sellerId : undefined
      });

      console.log('Received funnel data:', JSON.stringify(data));
      setFunilData(data);

      // Force reflow before showing bars
      setTimeout(() => setShowBars(true), 300);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Only fetch data when filterParams change, not tempFilterParams
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, filterParams]);

  const handleRefresh = () => {
    setShowBars(false);
    // Force reflow
    setTimeout(() => {
      fetchData();
    }, 100);
  };

  const calculatePercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const getColorForStep = (step: number) => {
    const colors = [
      'bg-gradient-to-r from-[#6D01EF] to-[#9A01EF]',      // Gradient purple
      'bg-gradient-to-r from-[#9A01EF] to-[#C901EF]',      // Gradient purple-pink
      'bg-gradient-to-r from-[#C901EF] to-[#EF01DC]',      // Gradient pink
      'bg-gradient-to-r from-[#EF01DC] to-[#FF01AA]',      // Gradient pink-red
      'bg-gradient-to-r from-[#FF01AA] to-[#FF1D7C]'       // Gradient red
    ];
    return colors[step % colors.length];
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
    // For 'all' or 'custom', dates will remain null unless custom dates are provided

    setTempFilterParams(prev => ({
      ...prev,
      startDate,
      endDate,
      period
    }));
  };

  // Handle selection for is_passive radio button
  const handleOriginChange = (value: boolean | null) => {
    setTempFilterParams(prev => ({
      ...prev,
      is_passive: value
    }));
  };

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTempFilterParams(prev => ({
      ...prev,
      sellerId: e.target.value
    }));
  };

  const handleApplyFilters = () => {
    // Reset bars and UI state
    setShowBars(false);
    setFunilData(null);
    setLoading(true);

    // Apply temp filters to main filters
    setFilterParams(tempFilterParams);

    // Update URL with filter params
    const params = new URLSearchParams();

    // Only add is_passive if it's not null (not "Todos")
    if (tempFilterParams.is_passive !== null) {
      params.set('is_passive', tempFilterParams.is_passive.toString());
    }

    // Only add date params if not "Todo o Período"
    if (tempFilterParams.period !== 'all') {
      if (tempFilterParams.startDate) {
        params.set('startDate', tempFilterParams.startDate);
      }

      if (tempFilterParams.endDate) {
        params.set('endDate', tempFilterParams.endDate);
      }
    }

    // Add sellerId param for admins if it's not 'all'
    if (isAdmin && tempFilterParams.sellerId !== 'all') {
      params.set('sellerId', tempFilterParams.sellerId || sellerId);
    }

    router.push(`/funil?${params.toString()}`);
    setShowFilters(false);
  };

  if (loading) {
    return (
      <div className={`${isLightTheme ? "bg-white" : "bg-[#111b21]"} h-full flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const funnelSteps = [
    { title: "Total de Conversas", value: funilData?.totalConversations || 0 },
    { title: "Pesquisou Produto", value: funilData?.productSearches || 0 },
    { title: "Carrinho", value: funilData?.cart || 0 },
    { title: "Pedido Confirmado", value: funilData?.confirmedOrders || 0 },
    { title: "Link enviado", value: funilData?.paymentLinksSent || 0 }
  ];

  const activePassivePercentages = {
    active: calculatePercentage(funilData?.activeConversations || 0, funilData?.totalConversations || 1),
    passive: calculatePercentage(funilData?.passiveConversations || 0, funilData?.totalConversations || 1)
  };

  return (
    <div className={`${isLightTheme ? "bg-white" : "bg-[#111b21]"} h-full flex flex-col`}>
      {/* Header */}
      <div className={`${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {isMobile && handleBack && (
            <button
              onClick={handleBack}
              className={`p-2 rounded-full transition-colors ${
                isLightTheme
                  ? "hover:bg-gray-300 text-gray-700"
                  : "hover:bg-[#374248] text-[#aebac1]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-semibold">Funil de Vendas</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Active filter badge */}
          {(filterParams.is_passive !== null || filterParams.startDate || filterParams.endDate) && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${isLightTheme ? "bg-blue-100 text-blue-800" : "bg-[#1f2c33] text-[#8696a0]"}`}>
              Filtros ativos
            </div>
          )}

          {/* Toggle View Button */}
          <button
            onClick={() => setShowPercentage(!showPercentage)}
            className={`p-2 rounded-full transition-colors ${
              isLightTheme
                ? "hover:bg-gray-300 text-gray-700"
                : "hover:bg-[#374248] text-[#aebac1]"
            }`}
            title={showPercentage ? "Mostrar números absolutos" : "Mostrar porcentagens"}
          >
            {showPercentage ? <Hash className="h-5 w-5" /> : <Percent className="h-5 w-5" />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full transition-colors ${
              isLightTheme
                ? "hover:bg-gray-300 text-gray-700"
                : "hover:bg-[#374248] text-[#aebac1]"
            } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Atualizar"
          >
            <RotateCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Filters Button */}
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Hidden when filters are shown on mobile */}
        <div className={`flex-1 p-6 overflow-y-auto ${isMobile && showFilters ? 'hidden' : ''}`}>
          {/* Filter summary */}
          {(filterParams.is_passive !== null || filterParams.startDate || filterParams.endDate) && (
            <div className={`max-w-4xl mx-auto mb-4 p-3 rounded-lg ${isLightTheme ? "bg-gray-100" : "bg-[#202c33]"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Filtros:</span>

                {filterParams.is_passive !== null && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isLightTheme ? "bg-white" : "bg-[#2a3942]"
                  }`}>
                    {filterParams.is_passive ? "Passivo" : "Ativo"}
                  </span>
                )}

                {filterParams.startDate && filterParams.endDate && (
                  <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                    isLightTheme ? "bg-white" : "bg-[#2a3942]"
                  }`}>
                    <Calendar className="h-3 w-3" />
                    {new Date(filterParams.startDate).toLocaleDateString()} - {new Date(filterParams.endDate).toLocaleDateString()}
                  </span>
                )}

                <button
                  onClick={() => {
                    setFilterParams({
                      is_passive: null,
                      startDate: null,
                      endDate: null,
                      period: 'all'
                    });
                    router.push('/funil');
                  }}
                  className={`px-2 py-1 text-xs underline ${
                    isLightTheme ? "text-blue-600" : "text-blue-400"
                  }`}
                >
                  Limpar todos
                </button>
              </div>
            </div>
          )}

          {/* Funnel Visualization */}
          <div className="max-w-4xl mx-auto space-y-6 mb-8 funnel-container">
            {/* Active/Passive Split Bar */}
            <div className="mb-4">
              <div className="mb-3 text-center">
                <h3 className="text-lg font-medium">Origem das Conversas</h3>
              </div>
              <div className="relative h-20 rounded-md overflow-hidden">
                <div className="absolute left-0 h-full w-full flex">
                  {/* Passive Bar */}
                  <div
                    className={`h-full bg-[#6D01EF] transition-all duration-1000 ease-out flex flex-col ${activePassivePercentages.passive < 15 ? 'pl-3' : 'items-center'} justify-center ${isLightTheme ? 'text-black' : 'text-white'} font-medium`}
                    style={{
                      width: showBars ? `${Math.max(activePassivePercentages.passive, 3)}%` : '0%',
                      opacity: showBars ? 1 : 0,
                      minWidth: activePassivePercentages.passive > 0 ? '30px' : '0px'
                    }}
                  >
                    {/* Text for passive bar (only shown if bar is not small) */}
                    {showBars && activePassivePercentages.passive >= 15 && (
                      <>
                        <div className="whitespace-nowrap text-lg font-bold">
                          {showPercentage
                            ? `${activePassivePercentages.passive}%`
                            : funilData?.passiveConversations.toLocaleString()}
                        </div>
                        <div className="text-xs mt-1 opacity-90">Passivo</div>
                      </>
                    )}
                  </div>

                  {/* Text for passive bar if small (outside the bar) */}
                  {showBars && activePassivePercentages.passive > 0 && activePassivePercentages.passive < 15 && (
                    <div className="absolute left-[3%] top-1/2 -translate-y-1/2 flex flex-col z-10 pr-3">
                      <div className="whitespace-nowrap text-lg font-bold">
                        {showPercentage
                          ? `${activePassivePercentages.passive}%`
                          : funilData?.passiveConversations.toLocaleString()}
                      </div>
                      <div className="text-xs mt-1 opacity-90">Passivo</div>
                    </div>
                  )}

                  {/* Active Bar */}
                  <div
                    className={`h-full bg-[#FF1D7C] transition-all duration-1000 ease-out flex flex-col ${activePassivePercentages.active < 15 ? 'items-start pl-3' : 'items-center'} justify-center ${isLightTheme ? 'text-black' : 'text-white'} font-medium`}
                    style={{
                      width: showBars ? `${Math.max(activePassivePercentages.active, 3)}%` : '0%',
                      opacity: showBars ? 1 : 0,
                      minWidth: activePassivePercentages.active > 0 ? '30px' : '0px'
                    }}
                  >
                    {/* Text for active bar (only shown if bar is not small) */}
                    {showBars && activePassivePercentages.active >= 15 && (
                      <>
                        <div className="whitespace-nowrap text-lg font-bold">
                          {showPercentage
                            ? `${activePassivePercentages.active}%`
                            : funilData?.activeConversations.toLocaleString()}
                        </div>
                        <div className="text-xs mt-1 opacity-90">Ativo</div>
                      </>
                    )}
                  </div>

                  {/* Text for active bar if small (outside the bar) */}
                  {showBars && activePassivePercentages.active > 0 && activePassivePercentages.active < 15 && (
                    <div className="absolute right-[3%] top-1/2 -translate-y-1/2 flex flex-col z-10 items-end">
                      <div className="whitespace-nowrap text-lg font-bold">
                        {showPercentage
                          ? `${activePassivePercentages.active}%`
                          : funilData?.activeConversations.toLocaleString()}
                      </div>
                      <div className="text-xs mt-1 opacity-90">Ativo</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Re-render the funnel when data changes */}
            <div key={`funnel-${JSON.stringify(funilData)}-${showBars ? 'visible' : 'hidden'}`}>
              <div className="mb-3 text-center">
                <h3 className="text-lg font-medium">Funil de Vendas</h3>
              </div>

              {/* Regular Funnel Steps */}
              {funnelSteps.map((step, index) => {
                const percentage = calculatePercentage(step.value, funilData?.totalConversations || 1);
                const color = getColorForStep(index);
                // Ensure minimum display width for visibility
                const displayPercentage = Math.max(percentage, 5);
                // Add indicator for very small values that are being scaled up
                const isScaledUp = percentage > 0 && percentage < 5;
                // Determine if this is a small bar (less than 15%)
                const isSmallBar = percentage < 15;

                return (
                  <div key={index} className="mb-5">
                    <div className="flex-1 relative h-20">
                      {/* Text label for small bars - positioned outside on the left */}
                      {isSmallBar && (
                        <div
                          className={`absolute left-[calc(50%-${displayPercentage/2}%-120px)] top-1/2 -translate-y-1/2 z-10 flex flex-col items-end pr-2`}
                          style={{ width: '120px' }}
                        >
                          <div className="text-lg font-bold">
                            {showBars ? (showPercentage ? `${percentage}%` : step.value.toLocaleString()) : ''}
                            {isScaledUp && <span className="text-xs ml-1">↑</span>}
                          </div>
                          <div className="text-xs mt-1 opacity-90">
                            {step.title}
                          </div>
                        </div>
                      )}

                      {/* The actual bar */}
                      <div
                        className={`absolute left-1/2 h-full rounded-md ${color} transition-all duration-1000 ease-out flex flex-col ${isSmallBar ? 'items-end pr-3' : 'items-center'} justify-center shadow-md ${isScaledUp ? 'border border-white' : ''}`}
                        style={{
                          width: showBars ? `${displayPercentage}%` : '0%',
                          transform: `translateX(-50%)`,
                          maxWidth: '100%',
                          opacity: showBars ? 1 : 0,
                          minWidth: percentage > 0 ? '30px' : '0px'
                        }}
                      >
                        {/* Only show text inside the bar if it's not small */}
                        {!isSmallBar && (
                          <>
                            <div className={`text-lg ${isLightTheme ? 'text-black' : 'text-white'} font-bold`}>
                              {showBars ? (showPercentage ? `${percentage}%` : step.value.toLocaleString()) : ''}
                              {isScaledUp && <span className="text-xs ml-1">↑</span>}
                            </div>
                            <div className={`text-xs ${isLightTheme ? 'text-black' : 'text-white'} mt-1 opacity-90 px-2`}>
                              {step.title}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Cards */}
          <div className={`${isLightTheme ? "bg-gray-100" : "bg-[#202c33]"} rounded-lg p-6 max-w-4xl mx-auto`}>
            <h2 className="text-lg font-semibold mb-4">Resumo de Conversões</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Taxa de Conversão", value: calculatePercentage(funilData?.confirmedOrders || 0, funilData?.totalConversations || 1), unit: "%" },
                { title: "Taxa de Abandono", value: calculatePercentage((funilData?.totalConversations || 0) - (funilData?.confirmedOrders || 0), funilData?.totalConversations || 1), unit: "%" },
                { title: "Taxa de Carrinho", value: calculatePercentage(funilData?.cart || 0, funilData?.totalConversations || 1), unit: "%" },
                { title: "Taxa de Pagamento", value: calculatePercentage(funilData?.paymentLinksSent || 0, funilData?.confirmedOrders || 1), unit: "%" }
              ].map((metric, index) => (
                <div key={index} className={`${isLightTheme ? "bg-white" : "bg-[#1f2c33]"} p-4 rounded-lg shadow-sm`}>
                  <div className="text-sm text-gray-500 mb-1">{metric.title}</div>
                  <div className="text-2xl font-bold">{metric.value}{metric.unit}</div>
                </div>
              ))}
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

                {/* Origin Filter (Active/Passive) - Updated to radio buttons */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Origem</h3>
                  <div className={`p-2 rounded-md grid grid-cols-3 gap-1 ${
                    isLightTheme
                      ? "bg-white border border-gray-300"
                      : "bg-[#2a3942] border border-[#374248]"
                  }`}>
                    {/* "Todos" option */}
                    <div
                      onClick={() => handleOriginChange(null)}
                      className={`py-2 px-3 rounded text-center cursor-pointer text-sm ${
                        tempFilterParams.is_passive === null
                          ? isLightTheme
                            ? "bg-blue-500 text-white"
                            : "bg-[#00a884] text-white"
                          : isLightTheme
                            ? "hover:bg-gray-100"
                            : "hover:bg-[#374248]"
                      }`}
                    >
                      Todos
                    </div>

                    {/* "Ativo" option */}
                    <div
                      onClick={() => handleOriginChange(false)}
                      className={`py-2 px-3 rounded text-center cursor-pointer text-sm ${
                        tempFilterParams.is_passive === false
                          ? isLightTheme
                            ? "bg-blue-500 text-white"
                            : "bg-[#00a884] text-white"
                          : isLightTheme
                            ? "hover:bg-gray-100"
                            : "hover:bg-[#374248]"
                      }`}
                    >
                      Ativo
                    </div>

                    {/* "Passivo" option */}
                    <div
                      onClick={() => handleOriginChange(true)}
                      className={`py-2 px-3 rounded text-center cursor-pointer text-sm ${
                        tempFilterParams.is_passive === true
                          ? isLightTheme
                            ? "bg-blue-500 text-white"
                            : "bg-[#00a884] text-white"
                          : isLightTheme
                            ? "hover:bg-gray-100"
                            : "hover:bg-[#374248]"
                      }`}
                    >
                      Passivo
                    </div>
                  </div>
                </div>

                {/* Seller Filter - Only show for ADMIN users */}
                {isAdmin && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Vendedor</h3>
                    <select
                      value={tempFilterParams.sellerId || 'all'}
                      onChange={handleSellerChange}
                      className={`w-full p-2 rounded-md ${
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
