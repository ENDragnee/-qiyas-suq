import type { Sale, SaleList } from "@/types";

/*
  GraphQL sales client (runs client-side; the Buy-now flow is interactive).
  Backend sales resolvers are functional: context.user is populated
  (ARCHITECTURE.md §10 item 1 fixed) and createSale returns
  { message, data } (§10 item 8 fixed), so Buy now works end-to-end.
*/

const GQL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${GQL}/api/graphql`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

export function createSale(input: {
  itemId: string;
  price: number;
  quantity: number;
  code: string;
  status?: string;
}) {
  return gql<{ createSale: { message: string; data: Sale } }>(
    `mutation($itemId:String!,$price:Float!,$quantity:Int!,$code:String!,$status:String){
       createSale(itemId:$itemId,price:$price,quantity:$quantity,code:$code,status:$status){
         message data { id itemId price quantity code status }
       }
     }`,
    input,
  );
}

export function fetchSales(input?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return gql<{ fetchSales: SaleList }>(
    `query($page:Int,$limit:Int,$status:String){
       fetchSales(page:$page,limit:$limit,status:$status){
         data { id itemId price quantity code status }
         metadata { totalDocuments totalPages currentPage hasNextPage hasPrevPage }
       }
     }`,
    input ?? {},
  );
}

export function fetchSale(saleId: string) {
  return gql<{ fetchSale: { message: string; data: Sale } }>(
    `query($saleId:String!){
       fetchSale(saleId:$saleId){
         message data { id itemId price quantity code status }
       }
     }`,
    { saleId },
  );
}

export function updateSalesStatus(saleId: string, status: string) {
  return gql<{
    updateSalesStatus: { message: string; status: string; data?: { name: string; stock: number; description?: string | null } };
  }>(
    `mutation($saleId:String!,$status:String!){
       updateSalesStatus(saleId:$saleId,status:$status){
         message status data { name stock description }
       }
     }`,
    { saleId, status },
  );
}
