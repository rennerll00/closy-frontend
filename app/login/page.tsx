'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { signin } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the signin function from /lib/api
      const res = await signin(email, password);
      localStorage.setItem('token', res.token);
      toast.success('Login realizado com sucesso!');
      router.push('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Erro no login:', err);
      toast.error(
        err?.message || 'Falha ao fazer login. Verifique seus dados.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col items-center justify-center px-4 sm:w-1/2 md:px-8 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center">
              <div className="mr-2 text-[#7052FF]">
                <img src="/images/logoblack.png" alt="Logo" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Entrar</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-[#5A00FE] py-2 text-white font-bold hover:bg-[#5A00FE]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              <span role="img" aria-label="lock">🔒</span> Ambiente protegido, dados seguros.
            </p>
          </div>
        </div>
      </div>

      {/* Lateral direita com imagem e texto */}
      <div className="hidden bg-[#7052FF] sm:block sm:w-1/2">
        <div className="flex h-full flex-col items-center justify-center px-8 text-white">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-4xl font-bold">Controle de fúnis de venda</h1>
            <h2 className="text-4xl font-bold">automatizadas com IA</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
