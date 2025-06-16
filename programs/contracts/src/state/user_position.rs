use anchor_lang::prelude::*;

#[account]
pub struct UserPosition {
    pub user: Pubkey,
    pub amount: u64,
    pub deposit_time: i64,
}

impl UserPosition {
    pub const INIT_SPACE: usize = 32 + 8 + 8; // pubkey + u64 + i64
}
