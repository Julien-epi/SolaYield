import React from "react";
import CreateStrategyForm from "../../components/Admin/CreateStrategyForm";
import CreateMarketplaceForm from "../../components/Admin/CreateMarketplaceForm";

const AdminPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-10">Espace Administrateur</h1>
      <div className="flex flex-col md:flex-row gap-10 md:gap-16 justify-center items-stretch">
        <div className="flex-1 w-full min-w-[340px] flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Créer une stratégie</h2>
          <div className="w-full">
            <CreateStrategyForm />
          </div>
        </div>
        <div className="flex-1 w-full min-w-[340px] flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Créer un marketplace</h2>
          <div className="w-full">
            <CreateMarketplaceForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 