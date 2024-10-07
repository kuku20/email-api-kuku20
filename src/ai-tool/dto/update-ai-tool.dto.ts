import { PartialType } from '@nestjs/mapped-types';
import { CreateAiToolDto } from './create-ai-tool.dto';

export class UpdateAiToolDto extends PartialType(CreateAiToolDto) {}
