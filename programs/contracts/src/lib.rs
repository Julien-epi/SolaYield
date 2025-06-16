#![allow(deprecated)]

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::{initialize::*, deposit::*, redeem::*};

declare_id!("2ZH4fshP8tRWMJd1E2YaH7DwddM5zSFxVRJ6V62667Nn");

#[program]
pub mod contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        handle_initialize(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        handle_deposit(ctx, amount)
    }

    pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
        handle_redeem(ctx)
    }
}
