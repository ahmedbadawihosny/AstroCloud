import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @MessagePattern({ cmd: 'findAccount' })
  findAccount(@Payload('userId') userId: string) {
    return this.accountService.findAccount(userId);
  }

  @MessagePattern({ cmd: 'updateAccount' })
  updateAccount(@Payload() payload: { userId: string; updateAccountDto: UpdateAccountDto }) {
    return this.accountService.updateAccount(payload.userId, payload.updateAccountDto);
  }
}
