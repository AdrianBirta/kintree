import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackClickDto } from './dto/track-click.dto';

@Injectable()
export class DonationsService {
  constructor(private prisma: PrismaService) { }

  trackClick(dto: TrackClickDto) {
    return this.prisma.donationClick.create({
      data: { tier: dto.tier ?? 'custom' },
    });
  }

  // NOU — folosit doar de tine, ca să vezi rapid câte click-uri s-au
  // adunat pe fiecare tier. Poți apela endpoint-ul manual din Postman/browser,
  // fără să construiești un dashboard dedicat.
  async getSummary() {
    const grouped = await this.prisma.donationClick.groupBy({
      by: ['tier'],
      _count: { tier: true },
    });

    const total = grouped.reduce((sum, g) => sum + g._count.tier, 0);

    return {
      total,
      byTier: grouped.map((g) => ({ tier: g.tier, count: g._count.tier })),
    };
  }
}