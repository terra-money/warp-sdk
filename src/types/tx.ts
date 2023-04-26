export type IncreaseAllowanceMsg = {
  increase_allowance: {
    spender: string;
    amount: string;
  };
};

export type ApproveMsg = {
  approve: {
    spender: string;
    token_id: string;
  };
};
