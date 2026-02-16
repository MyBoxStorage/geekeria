import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Package, Image, CreditCard, LogOut, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full">Voltar para Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header da Página */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                Minha Conta
              </h1>
              <p className="text-gray-600 mt-1">
                Olá, <span className="font-semibold text-[#00843D]">{user.email}</span>
              </p>
            </div>
            <Link to="/">
              <Button variant="outline">
                Voltar para Loja
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Menu de Tabs */}
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="stamps" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Minhas Estampas</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Card: Créditos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#00843D]" />
                    Créditos Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-[#00843D]">{user.credits || 0}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Use para gerar estampas com IA
                  </p>
                  <Link to="/">
                    <Button className="w-full mt-4" variant="outline">
                      Comprar Mais Créditos
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Card: Minhas Estampas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-blue-600" />
                    Minhas Estampas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Acesse suas estampas geradas com IA
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab('stamps')}
                  >
                    Ver Estampas
                  </Button>
                </CardContent>
              </Card>

              {/* Card: Meus Pedidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    Meus Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Acompanhe seus pedidos e compras
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab('orders')}
                  >
                    Ver Pedidos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Meus Pedidos */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pedidos</CardTitle>
                <CardDescription>
                  Consulte o status dos seus pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Consultar Pedido
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Use o número do pedido para acompanhar seu status
                  </p>
                  <Link to="/order">
                    <Button>
                      Acompanhar Pedido
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Minhas Estampas */}
          <TabsContent value="stamps">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Estampas</CardTitle>
                <CardDescription>
                  Estampas geradas com IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Suas Estampas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Acesse a galeria completa das suas estampas
                  </p>
                  <Link to="/minhas-estampas">
                    <Button>
                      Ver Galeria
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Configurações */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Conta</CardTitle>
                <CardDescription>
                  Gerencie suas preferências
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações do Usuário */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações da Conta</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Créditos</p>
                      <p className="font-medium">{user.credits || 0} créditos disponíveis</p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-6 border-t">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
