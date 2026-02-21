import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FluxerLinkGuard extends AuthGuard('fluxer-link') {}
