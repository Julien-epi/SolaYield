#![allow(deprecated)]
use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod error;

use instructions::{deposit, redeem};

declare_id!("2ZH4fshP8tRWMJd1E2YaH7DwddM5zSFxVRJ6V62667Nn");

#[program]
pub mod contracts {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        deposit::handle(ctx, amount)
    }

    pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
        redeem::handle(ctx)
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        seeds = [b"pool"],
        bump,
        space = 8 + crate::state::pool::Pool::INIT_SPACE
    )]
    pub pool: Account<'info, crate::state::pool::Pool>,

    #[account(
        init,
        payer = user,
        seeds = [b"user_position", user.key().as_ref()],
        bump,
        space = 8 + crate::state::user_position::UserPosition::INIT_SPACE
    )]
    pub user_position: Account<'info, crate::state::user_position::UserPosition>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, crate::state::pool::Pool>,

    #[account(
        mut,
        close = user,
        seeds = [b"user_position", user.key().as_ref()],
        bump,
        constraint = user_position.user == user.key()
    )]
    pub user_position: Account<'info, crate::state::user_position::UserPosition>,
}
