use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    pub total_deposits: u64,
}

impl Pool {
    pub const INIT_SPACE: usize = 8; // 64 bits
}
