import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-100 sm:text-5xl md:text-6xl">
          Tokenisez vos Yields sur Solana
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Transformez vos rendements DeFi en tokens échangeables. Staking, lending, et plus encore.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/staking"
            className="bg-indigo-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-indigo-700"
          >
            Commencer le Staking
          </Link>
          <Link
            href="/marketplace"
            className="bg-gray-900 text-indigo-400 px-6 py-3 rounded-md text-lg font-medium border border-indigo-400 hover:bg-gray-800"
          >
            Explorer le Marketplace
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-900 p-8 rounded-xl shadow-lg border-2 border-gray-700">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">Staking & Lending</h3>
          <p className="text-gray-400">
            Déposez vos actifs dans nos pools de staking et lending pour générer des rendements.
          </p>
        </div>
        <div className="bg-gray-900 p-8 rounded-xl shadow-lg border-2 border-gray-700">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">Tokenisation du Yield</h3>
          <p className="text-gray-400">
            Transformez vos rendements en tokens échangeables sur notre marketplace.
          </p>
        </div>
        <div className="bg-gray-900 p-8 rounded-xl shadow-lg border-2 border-gray-700">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">Trading de Yield</h3>
          <p className="text-gray-400">
            Achetez et vendez vos Yield Tokens avant leur maturité sur notre marketplace.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 p-10 rounded-xl shadow-lg border-2 border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-indigo-400">$10M+</p>
            <p className="text-gray-400">Total Value Locked</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-indigo-400">15%</p>
            <p className="text-gray-400">APY Moyen</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-indigo-400">1000+</p>
            <p className="text-gray-400">Utilisateurs Actifs</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-indigo-400">24/7</p>
            <p className="text-gray-400">Support</p>
          </div>
        </div>
      </section>
    </div>
  );
}
