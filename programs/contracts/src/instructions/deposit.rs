use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, TokenAccount, Token, MintTo, mint_to};

use crate::state::{pool::Pool, user_position::UserPosition};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, seeds = [b"pool"], bump)]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = user,
        seeds = [b"user_position", user.key().as_ref()],
        bump,
        space = 8 + UserPosition::INIT_SPACE
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut, seeds = [b"yt_mint"], bump)]
    pub yt_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = user,
        associated_token::mint = yt_mint,
        associated_token::authority = user
    )]
    pub user_yt_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let deposit = ctx.accounts;

    deposit.pool.total_deposits += amount;
    deposit.user_position.user = deposit.user.key();
    deposit.user_position.amount = amount;
    deposit.user_position.deposit_time = Clock::get()?.unix_timestamp;

    let bump = ctx.bumps.yt_mint;
    let signer_seeds: &[&[u8]] = &[b"yt_mint", &[bump]];
    let seeds: &[&[&[u8]]] = &[signer_seeds];

    let cpi_ctx = CpiContext::new_with_signer(
        deposit.token_program.to_account_info(),
        MintTo {
            mint: deposit.yt_mint.to_account_info(),
            to: deposit.user_yt_account.to_account_info(),
            authority: deposit.yt_mint.to_account_info(),
        },
        seeds,
    );

    mint_to(cpi_ctx, amount)?;

    Ok(())
}
