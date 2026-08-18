import { IsNotEmpty, IsString } from "class-validator";

export class ParcDto {
  id: string;
  name: string;
  description: string;
}

export class CreateParcDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
