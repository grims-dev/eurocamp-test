import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { ApiError } from "./api.error";

/**
 * Turns an ApiError into a sensible response instead of a blanket 500, so a
 * caller can tell "that parc does not exist" from "upstream is unreachable".
 */
@Catch(ApiError)
export class ApiErrorFilter implements ExceptionFilter {
  catch(error: ApiError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();

    // A 4xx is a real answer from upstream and belongs to the caller, so it is
    // passed through. Anything else means we never got a usable response.
    const status =
      error.status && error.status >= 400 && error.status < 500
        ? error.status
        : 502;

    response.status(status).json({
      statusCode: status,
      message: error.message,
      // Surfaced so a caller can see the client did try before giving up.
      attempts: error.attempts,
    });
  }
}
