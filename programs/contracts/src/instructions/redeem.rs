use anchor_lang::prelude::*;
use crate::error::CustomError;

pub fn handle(ctx: Context<crate::Redeem>) -> Result<()> {
    let clock = Clock::get()?;
    if clock.unix_timestamp < ctx.accounts.user_position.maturity_ts {
        return Err(CustomError::NotMature.into());
    }

    let amount = ctx.accounts.user_position.amount;
    ctx.accounts.pool.total_deposits -= amount;

    msg!("Redeemed {} successfully", amount);
    Ok(())
}
