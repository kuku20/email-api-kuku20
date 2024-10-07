import { Injectable } from '@nestjs/common';
import { CreateAiToolDto } from './dto/create-ai-tool.dto';
import { UpdateAiToolDto } from './dto/update-ai-tool.dto';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
@Injectable()
export class AiToolService {
  constructor(private readonly configService: ConfigService) {}
  async postGemini(message:string){
    try {
      const GEMINI_KEY = this.configService.get<any>('GEMINI_API')
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({model: "gemini-1.5-flash",});
      const generationConfig = {
        temperature: 1.1, // 0-2
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };
      const chatSession = model.startChat({
        generationConfig,
      });
  
      const result = await chatSession.sendMessage(message);
  
      return result.response.text()
    } catch (error) {
      return new Error(JSON.stringify({error:error}))
    }
  }
}
