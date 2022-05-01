export class NotFound extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class Timeout extends Error {
  constructor(message: string) {
    super(message);
  }
}
