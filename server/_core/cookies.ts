type CookieRequest = {
  protocol?: string;
  headers?: Record<string, string | string[] | undefined>;
};

export type SessionCookieOptions = {
  httpOnly: true;
  path: "/";
  sameSite: "none";
  secure: boolean;
};

function isSecureRequest(req: CookieRequest) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: CookieRequest
): SessionCookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}
