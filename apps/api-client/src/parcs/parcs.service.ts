import { Injectable } from "@nestjs/common";
import { ParcDto } from "./parcs.dto";

@Injectable()
export class ParcsService {
    async getAll(): Promise<ParcDto[]> {
      console.log('Hi from Parc service');
      return [];
    }
}
