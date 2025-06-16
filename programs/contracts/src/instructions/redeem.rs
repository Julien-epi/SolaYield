use crate::error::CustomError;
use crate::state::{pool::Pool, user_position::UserPosition};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        close = user,
        seeds = [b"user_position", user.key().as_ref()],
        bump,
        constraint = user_position.user == user.key()
    )]
    pub user_position: Account<'info, UserPosition>,
}

pub fn handle_redeem(ctx: Context<Redeem>) -> Result<()> {
    let clock = Clock::get()?;
    if clock.unix_timestamp < ctx.accounts.user_position.deposit_time + 60 {
        return Err(CustomError::NotMature.into());
    }

    let amount = ctx.accounts.user_position.amount;
    ctx.accounts.pool.total_deposits -= amount;

    msg!("Redeemed {} successfully", amount);
    Ok(())
}
