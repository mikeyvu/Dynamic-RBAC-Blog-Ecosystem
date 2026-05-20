import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Cannot leave email empty' })
  email!: string;

  @IsNotEmpty({ message: 'Password cannot leave blank' })
  @MinLength(6, { message: 'Password has to be at least 6 characters length' })
  password!: string;
}
