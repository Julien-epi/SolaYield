use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::state::pool::Pool;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        seeds = [b"pool"],
        bump,
        space = 8 + Pool::INIT_SPACE
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = authority,
        seeds = [b"yt_mint"],
        bump,
        mint::decimals = 9,
        mint::authority = yt_mint,
    )]
    pub yt_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.total_deposits = 0;

    msg!("Protocol initialized successfully");
    Ok(())
} 