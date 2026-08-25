type PostgrestReadResult = {
  error: {
    code?: string;
    message?: string;
  } | null;
};

const JWT_CLOCK_SKEW_RETRY_DELAY_MS = 1_250;

function isJwtIssuedAtFutureError(result: PostgrestReadResult) {
  return (
    result.error?.code === "PGRST303" &&
    result.error.message?.includes("JWT issued at future") === true
  );
}

export async function retryAuthenticatedReadOnce<
  Result extends PostgrestReadResult,
>(read: () => PromiseLike<Result>): Promise<Result> {
  const firstResult = await read();

  if (!isJwtIssuedAtFutureError(firstResult)) {
    return firstResult;
  }

  // Fresh Supabase Auth JWTs may occasionally be rejected momentarily by
  // PostgREST with PGRST303 "JWT issued at future" due to service clock skew.
  // Retry only this transient read failure once.
  await new Promise<void>((resolve) => {
    setTimeout(resolve, JWT_CLOCK_SKEW_RETRY_DELAY_MS);
  });

  return read();
}
