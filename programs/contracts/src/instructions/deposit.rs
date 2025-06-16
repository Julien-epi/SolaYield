use anchor_lang::prelude::*;

pub fn handle(ctx: Context<crate::Deposit>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let maturity_ts = clock.unix_timestamp + 60;

    let pool = &mut ctx.accounts.pool;
    let user_position = &mut ctx.accounts.user_position;

    pool.total_deposits += amount;

    user_position.user = ctx.accounts.user.key();
    user_position.amount = amount;
    user_position.maturity_ts = maturity_ts;

    msg!("User deposited {}. Maturity at {}", amount, maturity_ts);
    Ok(())
}
