export type CardNumbers = (number | null)[];

export type UnsignedCard = {
  v: 1;
  name: string;
  nums: CardNumbers;
  createdAt: number;
};

export type SignedCard = {
  v: 1;
  cid: string;
  gid: string;
  nums: CardNumbers;
  iat: number;
  uid?: string | number;
  name?: string;
};

export type CardPayload = UnsignedCard | SignedCard;

export type ParsedToken =
  | { kind: "unsigned"; payload: UnsignedCard; encoded: string }
  | { kind: "signed"; payload: SignedCard; encoded: string; signature: string };

export type TokenErrorCode =
  | "MALFORMED_TOKEN"
  | "UNSUPPORTED_VERSION"
  | "INVALID_PAYLOAD"
  | "INVALID_SIGNATURE"
  | "SERVICE_UNAVAILABLE"
  | "MISSING_TOKEN";

export type TokenVerifyResult =
  | {
      valid: true;
      kind: "signed";
      signatureValid: true;
      payload: SignedCard;
    }
  | {
      valid: true;
      kind: "unsigned";
      signatureValid: false;
      payload: UnsignedCard;
    }
  | {
      valid: false;
      kind?: "signed" | "unsigned";
      signatureValid?: false;
      error: {
        code: TokenErrorCode;
        message: string;
      };
      payload?: CardPayload;
    };
