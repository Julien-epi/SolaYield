use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Yield has not matured yet")]
    NotMature,
}