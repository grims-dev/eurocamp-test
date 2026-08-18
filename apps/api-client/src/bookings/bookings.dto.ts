import { IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class BookingDto {
  id: string;
  /** Upstream stores the user id here, not a nested user object. */
  user: string;
  /** Likewise a parc id. */
  parc: string;
  bookingdate: string;
  comments?: string;
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  parc: string;

  @IsISO8601()
  bookingdate: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
