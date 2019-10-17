// API/src/Modules/Users/UserModel.ts
import { ObjectType, Field, ID, ArgumentValidationError } from 'type-graphql';
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from './UserRole';
import {
  validatePassword,
  generateToken,
  hashPassword,
} from '../Auth/AuthController';
import { Validate } from 'class-validator';
import {
  UniqueUsernameConstraint,
  UniqueEmailConstraint,
} from '../Auth/AuthValidator';
import { Subscriber } from '../Subscribers/SubscriberModel';
import { Zone } from '../Zones/ZoneModel';
import { Permission } from '../Permission/Permission';
import { ACME } from '../ACMEs/ACMEModel';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('varchar')
  @Validate(UniqueUsernameConstraint)
  username: string;

  @Column('varchar')
  @Validate(UniqueEmailConstraint)
  email: string;

  @Column({
    array: true,
    enum: UserRole,
    type: 'enum',
    default: [UserRole.USER],
  })
  roles: UserRole[];

  @Column('text')
  hashedPassword: string;

  async generateToken(plainText: string): Promise<string> {
    const valid = await validatePassword(plainText, this.hashedPassword);
    if (!valid)
      throw new ArgumentValidationError([
        {
          property: 'password',
          constraints: {
            isValid: 'Password is invalid',
          },
          children: [],
        },
      ]);
    return generateToken(this);
  }

  async setPassword(plainText: string): Promise<void> {
    this.hashedPassword = await hashPassword(plainText);
  }

  get subscribers(): Promise<Subscriber[]> {
    return Subscriber.getSubscribers(this);
  }

  get zones(): Promise<Zone[]> {
    return Zone.getUserZones(this, Permission.READ);
  }

  get ACMEs(): Promise<ACME[]> {
    return ACME.getUserACMEs(this);
  }
}
