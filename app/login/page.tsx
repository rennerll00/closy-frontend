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
              <div className="mr-2 text-blue-600">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 3.33334C10.8 3.33334 3.33334 10.8 3.33334 20C3.33334 29.2 10.8 36.6667 20 36.6667C29.2 36.6667 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33334 20 3.33334ZM20 8.33334C22.7667 8.33334 25 10.5667 25 13.3333C25 16.1 22.7667 18.3333 20 18.3333C17.2333 18.3333 15 16.1 15 13.3333C15 10.5667 17.2333 8.33334 20 8.33334ZM20 32C15.8333 32 12.1333 29.8333 10 26.5C10.05 23.25 16.6667 21.5 20 21.5C23.3167 21.5 29.95 23.25 30 26.5C27.8667 29.8333 24.1667 32 20 32Z"
                    fill="#3B5998"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold text-blue-600">ChatJurídico</span>
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
              className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700"
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
      <div className="hidden bg-blue-600 sm:block sm:w-1/2">
        <div className="flex h-full flex-col items-center justify-center px-8 text-white">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-4xl font-bold">Multiatendimento para escritórios</h1>
            <h2 className="text-4xl font-bold">de alta performance</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
