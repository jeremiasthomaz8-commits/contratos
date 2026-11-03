export async function api(path: string, data?: unknown) {
  const response = await fetch(`/api/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error +
        (result.fields
          ? " " +
            result.fields.map((f: { message: string }) => f.message).join(" ")
          : ""),
    );
  return result;
}
