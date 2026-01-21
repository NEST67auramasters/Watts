import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type TransferRequest, type FineRequest, type LoanRequest } from "@shared/routes";

// USERS (Admin/List)
export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path);
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

// TRANSACTIONS
export function useTransactions() {
  return useQuery({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.list.path);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
  });
}

export function useTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TransferRequest) => {
      const res = await fetch(api.transactions.transfer.path, {
        method: api.transactions.transfer.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 402) throw new Error("Not enough money!");
        if (res.status === 400) throw new Error("Invalid transfer details");
        throw new Error("Transfer failed");
      }
      return api.transactions.transfer.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); // Update balance
    },
  });
}

export function useFine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FineRequest) => {
      const res = await fetch(api.transactions.fine.path, {
        method: api.transactions.fine.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Only admins can issue fines");
        throw new Error("Fine failed");
      }
      return api.transactions.fine.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] }); // Update user balances
    },
  });
}

// LOANS
export function useLoans() {
  return useQuery({
    queryKey: [api.loans.list.path],
    queryFn: async () => {
      const res = await fetch(api.loans.list.path);
      if (!res.ok) throw new Error("Failed to fetch loans");
      return api.loans.list.responses[200].parse(await res.json());
    },
  });
}

export function useApplyLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LoanRequest) => {
      const res = await fetch(api.loans.apply.path, {
        method: api.loans.apply.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Loan application failed");
      return api.loans.apply.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.loans.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useRepayLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      const url = buildUrl(api.loans.repay.path, { id });
      const res = await fetch(url, {
        method: api.loans.repay.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      
      if (!res.ok) {
        if (res.status === 402) throw new Error("Not enough money to repay");
        throw new Error("Repayment failed");
      }
      return api.loans.repay.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.loans.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}
