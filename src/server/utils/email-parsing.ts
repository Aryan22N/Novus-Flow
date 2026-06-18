/* eslint-disable */
export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export function getHeader(headers: { name: string; value: string }[], name: string) {
  return headers.find(
    (header) => header.name.toLowerCase() === name.toLowerCase(),
  )?.value;
}

export function extractSender(fromHeader?: string) {
  if (!fromHeader) return "Unknown";

  // ngrok team <team@m.ngrok.com>
  const match = fromHeader.match(/^(.+?)\s*</);

  if (match?.[1]) {
    return match[1].replace(/"/g, "");
  }

  return fromHeader;
}

export function decodeBase64Url(base64UrlStr: string) {
  try {
    const base64 = base64UrlStr.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch (e) {
    return "";
  }
}

export function parsePayload(payload: any) {
  let htmlBody = "";
  let plainBody = "";
  let attachments: Attachment[] = [];

  function traverse(part: any) {
    if (!part) return;

    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0,
      });
    }

    if (part.mimeType === "text/html" && part.body?.data) {
      htmlBody = decodeBase64Url(part.body.data);
    } else if (part.mimeType === "text/plain" && part.body?.data) {
      plainBody = decodeBase64Url(part.body.data);
    }

    if (part.parts) {
      for (const p of part.parts) {
        traverse(p);
      }
    }
  }

  traverse(payload);

  // If no parts array but body data is present on the top-level payload
  if (!payload?.parts && payload?.body?.data) {
    if (payload.mimeType === "text/html") {
      htmlBody = decodeBase64Url(payload.body.data);
    } else if (payload.mimeType === "text/plain") {
      plainBody = decodeBase64Url(payload.body.data);
    }
  }

  return { htmlBody, plainBody, attachments };
}

export function getEmailCategory(labelIds?: string[]) {
  if (!labelIds) return "primary";
  if (labelIds.includes("CATEGORY_PROMOTIONS")) return "promotions";
  if (labelIds.includes("CATEGORY_SOCIAL")) return "socials";
  if (labelIds.includes("CATEGORY_UPDATES")) return "updates";
  return "primary";
}
