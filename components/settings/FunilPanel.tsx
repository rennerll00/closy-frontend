import { Filter, X, RotateCw } from "lucide-react";
import { useState, useEffect } from "react";
import { getFunilAnalytics } from "@/lib/api";

interface FunilPanelProps {
  isLightTheme: boolean;
  isMobile: boolean;
  sellerId: string;
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

export default function FunilPanel({ isLightTheme, isMobile, sellerId }: FunilPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [funilData, setFunilData] = useState<FunilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBars, setShowBars] = useState(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const data = await getFunilAnalytics(sellerId);
      setFunilData(data);
      setTimeout(() => setShowBars(true), 100);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sellerId]);

  const handleRefresh = () => {
    setShowBars(false);
    fetchData();
  };

  const calculatePercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const getColorForStep = (step: number) => {
    const colors = [
      'bg-red-500',      // Product - Red
      'bg-[#8b1a6e]',   // Cart - Purple
      'bg-[#4b0082]',   // Purchase - Deep Purple
      'bg-blue-700',    // Register - Blue
      'bg-blue-500'     // Cancel - Light Blue
    ];
    return colors[step % colors.length];
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
    { title: "Link de Pagamento Enviado", value: funilData?.paymentLinksSent || 0 }
  ];

  const activePassivePercentages = {
    active: calculatePercentage(funilData?.activeConversations || 0, funilData?.totalConversations || 1),
    passive: calculatePercentage(funilData?.passiveConversations || 0, funilData?.totalConversations || 1)
  };

  return (
    <div className={`${isLightTheme ? "bg-white" : "bg-[#111b21]"} h-full flex flex-col`}>
      {/* Header */}
      <div className={`${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} p-4 flex items-center justify-between`}>
        <h1 className="text-xl font-semibold">Funil de Vendas</h1>
        <div className="flex items-center gap-2">
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
          {/* Funnel Visualization */}
          <div className="max-w-4xl mx-auto space-y-6 mb-8">
            {/* Active/Passive Split Bar */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-32 text-sm text-right whitespace-nowrap">
                Origem
              </div>
              <div className="flex-1">
                {/* Labels above the bars */}
                <div className="flex mb-1 text-sm">
                  <div className="flex-1">
                    <span className="text-sky-600 font-medium">Passivo</span>
                    <span className="text-gray-500 ml-2">
                      {funilData?.passiveConversations.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-emerald-600 font-medium">Ativo</span>
                    <span className="text-gray-500 ml-2">
                      {funilData?.activeConversations.toLocaleString()}
                    </span>
                  </div>
                </div>
                {/* Bars */}
                <div className="relative h-12">
                  <div className="absolute left-0 h-full w-full flex">
                    {/* Passive Bar */}
                    <div
                      className={`h-full bg-sky-500 transition-all duration-1000 ease-out flex items-center justify-center text-white font-medium`}
                      style={{
                        width: showBars ? `${activePassivePercentages.passive}%` : '0%',
                        opacity: showBars ? 1 : 0
                      }}
                    >
                      {showBars && activePassivePercentages.passive > 15 && (
                        <div className="whitespace-nowrap">
                          {activePassivePercentages.passive}%
                        </div>
                      )}
                    </div>
                    {/* Active Bar */}
                    <div
                      className={`h-full bg-emerald-500 transition-all duration-1000 ease-out flex items-center justify-center text-white font-medium`}
                      style={{
                        width: showBars ? `${activePassivePercentages.active}%` : '0%',
                        opacity: showBars ? 1 : 0
                      }}
                    >
                      {showBars && activePassivePercentages.active > 15 && (
                        <div className="whitespace-nowrap">
                          {activePassivePercentages.active}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-24 text-sm">
                {funilData?.totalConversations.toLocaleString()}
              </div>
            </div>

            {/* Regular Funnel Steps */}
            {funnelSteps.map((step, index) => {
              const percentage = calculatePercentage(step.value, funilData?.totalConversations || 1);
              const color = getColorForStep(index);

              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-32 text-sm text-right whitespace-nowrap">
                    {step.title}
                  </div>
                  <div className="flex-1 relative h-12">
                    <div
                      className={`absolute left-1/2 h-full ${color} transition-all duration-1000 ease-out`}
                      style={{
                        width: showBars ? `${percentage}%` : '0%',
                        transform: `translateX(-50%)`,
                        maxWidth: '100%',
                        opacity: showBars ? 1 : 0
                      }}
                    >
                      <div className="h-full flex items-center justify-center text-white font-medium">
                        {showBars ? `${percentage}%` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-sm">
                    {step.value.toLocaleString()}
                  </div>
                </div>
              );
            })}
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
                    <select className={`w-full p-2 rounded-md ${
                      isLightTheme
                        ? "bg-white border border-gray-300"
                        : "bg-[#2a3942] border border-[#374248]"
                    }`}>
                      <option>Últimos 7 dias</option>
                      <option>Últimos 30 dias</option>
                      <option>Últimos 90 dias</option>
                      <option>Personalizado</option>
                    </select>
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Conhecimento</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Interesse</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Decisão</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Ação</span>
                    </label>
                  </div>
                </div>

                {/* Seller Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Vendedor</h3>
                  <select className={`w-full p-2 rounded-md ${
                    isLightTheme
                      ? "bg-white border border-gray-300"
                      : "bg-[#2a3942] border border-[#374248]"
                  }`}>
                    <option>Todos os vendedores</option>
                    <option>Vendedor 1</option>
                    <option>Vendedor 2</option>
                    <option>Vendedor 3</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filters Footer */}
            <div className={`${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} p-4 flex justify-end gap-2`}>
              <button
                className={`px-4 py-2 rounded-md ${
                  isLightTheme
                    ? "bg-gray-300 hover:bg-gray-400"
                    : "bg-[#374248] hover:bg-[#4a5c66]"
                }`}
                onClick={() => setShowFilters(false)}
              >
                Cancelar
              </button>
              <button
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
