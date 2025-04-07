import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

// API function
import { getChatStates } from '@/lib/api';

// Define types for state data
interface ChatState {
  choice: string;
  count: number;
}

interface FunilPanelProps {
  isLightTheme: boolean;
  isMobile: boolean;
  handleBack?: () => void;
}

export default function FunilPanel({ isLightTheme, isMobile, handleBack }: FunilPanelProps) {
  const [chatStates, setChatStates] = useState<ChatState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Choice mapping to display friendly names
  const choiceMapping: { [key: string]: string } = {
    "GREETING": "Saudação",
    "INVENTORY_LOOKUP": "Consulta de Estoque",
    "INTENT_SUMMARY_VARIANTS": "Resumo de Intenção",
    "PRODUCT_MORE_IMAGES": "Mais Imagens do Produto",
    "DELIVERY_PICKUP_OPTIONS": "Opções de Entrega",
    "PAYMENT_OPTIONS": "Opções de Pagamento",
    "CONCLUSION": "Conclusão",
    "HUMAN_INTERVENTION": "Intervenção Humana",
    "ORDER_STATUS": "Status do Pedido",
    "PRODUCT_DISCUSSION": "Discussão do Produto",
    "CONFIRMED_SUMMARY": "Resumo Confirmado",
    "ASK_FOR_SIZING": "Pergunta por Tamanho",
    "STORE_QUESTION": "Pergunta da Loja",
    "BROAD": "Busca",
    "UNKNOWN": "Desconhecido",
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getChatStates();
      setChatStates(data);
    } catch (err) {
      console.error('Error fetching chat states:', err);
      setError('Falha ao carregar dados do funil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Calculate total count for percentages
  const totalCount = chatStates.reduce((acc, state) => acc + state.count, 0);

  return (
    <div className={`flex-1 flex flex-col ${isLightTheme ? "bg-gray-50" : "bg-[#111b21]"}`}>
      {/* HEADER */}
      <div className={`${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} flex items-center justify-between px-4 py-3`}>
        <div className="flex items-center gap-3">
          {isMobile && handleBack && (
            <button className="mr-1" onClick={handleBack}>
              <ArrowLeft className={`${isLightTheme ? "text-black" : "text-white"} w-5 h-5`} />
            </button>
          )}
          <div>
            <h2 className="font-medium text-lg">Funil de Vendas</h2>
            <p className="text-xs">Análise de estados de conversação</p>
          </div>
        </div>
        <div>
          <button
            onClick={fetchData}
            className={`${isLightTheme ? "bg-gray-300" : "bg-[#374248]"} p-2 rounded-full hover:${isLightTheme ? "bg-gray-400" : "bg-[#4a5961]"} transition-colors duration-200`}
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className={`flex-1 overflow-y-auto p-4 ${isLightTheme ? "text-gray-800" : "text-white"}`}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        ) : (
          <div className={`p-4 rounded-lg ${isLightTheme ? "bg-white shadow-md" : "bg-[#1f2c33]"}`}>
            <h2 className="text-lg font-semibold mb-4">Distribuição de Estados de Conversação</h2>

            {chatStates.length === 0 ? (
              <p>Nenhum dado disponível.</p>
            ) : (
              <div className="space-y-4">
                {chatStates.map((state) => {
                  const percentage = totalCount > 0 ? ((state.count / totalCount) * 100).toFixed(1) : '0';
                  const displayName = choiceMapping[state.choice] || state.choice;

                  return (
                    <div key={state.choice} className={`p-4 rounded-md ${isLightTheme ? "bg-gray-100" : "bg-[#2a3942]"}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{displayName}</h3>
                        <div className="flex items-center">
                          <span className="text-lg font-bold mr-2">{state.count}</span>
                          <span className={`text-sm ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className={`w-full h-2 rounded-full ${isLightTheme ? "bg-gray-200" : "bg-[#374248]"}`}>
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
