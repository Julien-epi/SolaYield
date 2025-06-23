#![allow(deprecated)]

use anchor_lang::prelude::*;

declare_id!("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");

pub mod instructions;
pub mod state;
pub mod error;

use instructions::*;

#[program]
pub mod contracts {
    use super::*;

    /// Initialize the SolaYield protocol
    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        instructions::handle_initialize_protocol(ctx)
    }

    /// Create a new yield strategy (admin only)
    pub fn create_strategy(
        ctx: Context<CreateStrategy>,
        name: String,
        apy: u64,
        strategy_id: u64,
    ) -> Result<()> {
        instructions::handle_create_strategy(ctx, name, apy, strategy_id)
    }

    /// Deposit tokens into a specific strategy
    pub fn deposit_to_strategy(
        ctx: Context<DepositToStrategy>,
        amount: u64,
        strategy_id: u64,
    ) -> Result<()> {
        instructions::handle_deposit_to_strategy(ctx, amount, strategy_id)
    }

    /// Claim accumulated yield from a strategy
    pub fn claim_yield(
        ctx: Context<ClaimYield>,
        strategy_id: u64,
    ) -> Result<()> {
        instructions::handle_claim_yield(ctx, strategy_id)
    }

    /// Withdraw principal from a strategy
    pub fn withdraw_from_strategy(
        ctx: Context<WithdrawFromStrategy>,
        amount: u64,
        strategy_id: u64,
    ) -> Result<()> {
        instructions::handle_withdraw_from_strategy(ctx, amount, strategy_id)
    }
}
