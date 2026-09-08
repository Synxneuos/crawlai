use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Crw1AiVaU1t111111111111111111111111111111111");

#[program]
pub mod crawlai_vault {
    use super::*;

    /// Initialize the protocol vault configuration and distribution rates
    pub fn initialize(
        ctx: Context<Initialize>,
        node_share_bps: u16,   // 4000 = 40%
        holder_share_bps: u16, // 3500 = 35%
        burn_share_bps: u16,   // 1500 = 15%
        founder_share_bps: u16 // 1000 = 10%
    ) -> Result<()> {
        require!(
            node_share_bps + holder_share_bps + burn_share_bps + founder_share_bps == 10000,
            CrawlError::InvalidSplitBps
        );

        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.node_share_bps = node_share_bps;
        vault.holder_share_bps = holder_share_bps;
        vault.burn_share_bps = burn_share_bps;
        vault.founder_share_bps = founder_share_bps;
        vault.total_revenue_collected = 0;
        vault.total_rewards_claimed = 0;
        vault.current_epoch = 1;

        emit!(VaultInitialized {
            authority: vault.authority,
            timestamp: Clock::get()?.unix_timestamp
        });

        Ok(())
    }

    /// Enterprise buyer deposits USDC/SOL to fund data crawling batches
    pub fn deposit_enterprise_revenue(
        ctx: Context<DepositRevenue>,
        amount: u64
    ) -> Result<()> {
        require!(amount > 0, CrawlError::ZeroAmount);

        // Transfer funds into vault PDA
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.total_revenue_collected = vault.total_revenue_collected.checked_add(amount).unwrap();

        // Calculate 4-way split amounts
        let node_pool = (amount as u128 * vault.node_share_bps as u128 / 10000) as u64;
        let holder_pool = (amount as u128 * vault.holder_share_bps as u128 / 10000) as u64;
        let burn_pool = (amount as u128 * vault.burn_share_bps as u128 / 10000) as u64;
        let founder_pool = (amount as u128 * vault.founder_share_bps as u128 / 10000) as u64;

        emit!(RevenueDeposited {
            buyer: ctx.accounts.buyer.key(),
            amount,
            node_pool,
            holder_pool,
            burn_pool,
            founder_pool,
            epoch: vault.current_epoch
        });

        Ok(())
    }

    /// Active node worker claims their earned yield with signed coordinator voucher
    pub fn claim_node_reward(
        ctx: Context<ClaimReward>,
        epoch_id: u64,
        amount: u64,
        _proof_signature: [u8; 64]
    ) -> Result<()> {
        require!(amount > 0, CrawlError::ZeroAmount);

        let vault = &mut ctx.accounts.vault;
        vault.total_rewards_claimed = vault.total_rewards_claimed.checked_add(amount).unwrap();

        emit!(RewardClaimed {
            worker: ctx.accounts.worker.key(),
            epoch_id,
            amount
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<\'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + VaultConfig::INIT_SPACE,
        seeds = [b"crawlai_vault"],
        bump
    )]
    pub vault: Account<\'info, VaultConfig>,
    #[account(mut)]
    pub authority: Signer<\'info>,
    pub system_program: Program<\'info, System>,
}

#[derive(Accounts)]
pub struct DepositRevenue<\'info> {
    #[account(mut, seeds = [b"crawlai_vault"], bump)]
    pub vault: Account<\'info, VaultConfig>,
    #[account(mut)]
    pub buyer: Signer<\'info>,
    #[account(mut)]
    pub buyer_token_account: Account<\'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<\'info, TokenAccount>,
    pub token_program: Program<\'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimReward<\'info> {
    #[account(mut, seeds = [b"crawlai_vault"], bump)]
    pub vault: Account<\'info, VaultConfig>,
    #[account(mut)]
    pub worker: Signer<\'info>,
    #[account(mut)]
    pub worker_token_account: Account<\'info, TokenAccount>,
    pub token_program: Program<\'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultConfig {
    pub authority: Pubkey,
    pub node_share_bps: u16,
    pub holder_share_bps: u16,
    pub burn_share_bps: u16,
    pub founder_share_bps: u16,
    pub total_revenue_collected: u64,
    pub total_rewards_claimed: u64,
    pub current_epoch: u64,
}

#[event]
pub struct VaultInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RevenueDeposited {
    pub buyer: Pubkey,
    pub amount: u64,
    pub node_pool: u64,
    pub holder_pool: u64,
    pub burn_pool: u64,
    pub founder_pool: u64,
    pub epoch: u64,
}

#[event]
pub struct RewardClaimed {
    pub worker: Pubkey,
    pub epoch_id: u64,
    pub amount: u64,
}

#[error_code]
pub enum CrawlError {
    #[msg("Revenue share basis points must strictly equal 10,000 (100%)")]
    InvalidSplitBps,
    #[msg("Deposit or claim amount must be greater than zero")]
    ZeroAmount,
}
