import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import {
  Annotation,
  AnnotationStatus,
  AnnotationOwnerType,
} from '../../entities/annotation.entity';
import { User } from '../../entities/user.entity';
import { Logger } from '@nestjs/common';

export class AnnotationSeeder implements Seeder {
  private readonly logger = new Logger(AnnotationSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<void> {
    const annotationRepository = this.dataSource.getRepository(Annotation);
    const userRepository = this.dataSource.getRepository(User);

    // Get users for annotation authorship
    const users = await userRepository.find({ take: 5 });

    if (users.length === 0) {
      this.logger.warn('No users found for annotation authorship');
      return;
    }

    const annotations: Partial<Annotation>[] = [
      // Character annotations
      {
        ownerType: AnnotationOwnerType.CHARACTER,
        ownerId: 1, // Assuming Baku Madarame
        title: "Baku's Gambling Philosophy",
        content:
          'Baku Madarame embodies a unique philosophy toward gambling and risk. Unlike conventional gamblers who rely on luck or simple probability, Baku approaches each gamble as a psychological battlefield. His understanding of human nature allows him to manipulate opponents and create winning scenarios where none seem to exist.',
        sourceUrl: null,
        chapterReference: 1,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[0].id,
      },
      {
        ownerType: AnnotationOwnerType.CHARACTER,
        ownerId: 1, // Baku Madarame
        title: "The Meaning Behind Baku's Name",
        content:
          'The name "Baku" is derived from the Japanese mythological creature that devours nightmares. This symbolism is fitting for a character who excels at turning seemingly hopeless situations into victories, effectively "eating" the despair of his opponents.',
        sourceUrl: 'https://en.wikipedia.org/wiki/Baku_(mythology)',
        chapterReference: null,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[1].id,
      },
      {
        ownerType: AnnotationOwnerType.CHARACTER,
        ownerId: 2, // Assuming Kaji Takaomi
        title: "Kaji's Role as the Referee",
        content:
          'Kaji Takaomi serves as more than just Baku\'s companion. His role as a neutral observer and "referee" in many gambles represents the importance of having someone who can see the bigger picture and maintain objectivity even in the most intense situations.',
        sourceUrl: null,
        chapterReference: 5,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[2].id,
      },
      {
        ownerType: AnnotationOwnerType.CHARACTER,
        ownerId: 3, // Assuming another character
        title: 'Character Development Through Gambles',
        content:
          "This character's transformation throughout the series demonstrates how the manga uses gambling as a lens to explore personal growth. Each gamble reveals new facets of their personality and pushes them to evolve beyond their initial limitations.",
        sourceUrl: null,
        chapterReference: 15,
        isSpoiler: true,
        spoilerChapter: 20,
        status: AnnotationStatus.APPROVED,
        authorId: users[3].id,
      },

      // Gamble annotations
      {
        ownerType: AnnotationOwnerType.GAMBLE,
        ownerId: 1, // First gamble
        title: 'Historical Context of This Game',
        content:
          'This gambling game has roots in traditional Japanese gambling culture. Understanding its historical significance adds depth to how the characters approach and manipulate the rules during the match.',
        sourceUrl: null,
        chapterReference: 10,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[0].id,
      },
      {
        ownerType: AnnotationOwnerType.GAMBLE,
        ownerId: 2, // Second gamble
        title: 'The Psychology of Bluffing',
        content:
          'This gamble showcases masterful psychological warfare. The strategies employed go beyond simple card counting or probability - they delve into reading micro-expressions, creating false patterns, and exploiting cognitive biases.',
        sourceUrl: null,
        chapterReference: 25,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[1].id,
      },

      // Arc annotations that appear on specific chapters
      {
        ownerType: AnnotationOwnerType.ARC,
        ownerId: 1, // First arc
        title: 'Introduction to Kakerou',
        content:
          'This chapter introduces the underground gambling organization Kakerou, which plays a central role throughout the series. The organization operates with a strict hierarchy and serves as both facilitator and enforcer of high-stakes gambles.',
        sourceUrl: null,
        chapterReference: 1,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[2].id,
      },
      {
        ownerType: AnnotationOwnerType.ARC,
        ownerId: 2, // Second arc
        title: 'Turning Point in the Narrative',
        content:
          "This chapter marks a significant shift in the story's direction. The revelations here change the stakes of future gambles and introduce new layers of complexity to the overarching plot.",
        sourceUrl: null,
        chapterReference: 50,
        isSpoiler: true,
        spoilerChapter: 50,
        status: AnnotationStatus.APPROVED,
        authorId: users[3].id,
      },

      // Arc annotations
      {
        ownerType: AnnotationOwnerType.ARC,
        ownerId: 1, // First arc
        title: "Establishing the Rules of Usogui's World",
        content:
          'This arc establishes the fundamental rules and atmosphere of the Usogui universe. It introduces key concepts about gambling, trust, and deception that will be explored throughout the series. The early gambles demonstrate that victory requires more than luck or skill - it demands understanding human psychology.',
        sourceUrl: null,
        chapterReference: null,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[0].id,
      },
      {
        ownerType: AnnotationOwnerType.ARC,
        ownerId: 2, // Second arc
        title: 'Escalation of Stakes',
        content:
          'This arc demonstrates how the manga escalates both the complexity of its gambles and the personal stakes involved. The introduction of new opponents and gambling formats keeps the narrative fresh while maintaining its core themes.',
        sourceUrl: null,
        chapterReference: null,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[1].id,
      },

      // Additional character annotations for variety
      {
        ownerType: AnnotationOwnerType.CHARACTER,
        ownerId: 4,
        title: 'Symbolism in Character Design',
        content:
          'The visual design of this character reflects their role in the narrative. From their clothing choices to their facial expressions, every detail conveys information about their personality and approach to gambling.',
        sourceUrl: null,
        chapterReference: null,
        isSpoiler: false,
        spoilerChapter: null,
        status: AnnotationStatus.APPROVED,
        authorId: users[4 % users.length].id,
      },
      {
        ownerType: AnnotationOwnerType.CHARACTER,
        ownerId: 5,
        title: "The Antagonist's Perspective",
        content:
          "Understanding this character's motivations adds complexity to their role as an antagonist. They're not simply evil - they operate according to their own code and philosophy, making them a compelling foil to the protagonist.",
        sourceUrl: null,
        chapterReference: 30,
        isSpoiler: true,
        spoilerChapter: 35,
        status: AnnotationStatus.APPROVED,
        authorId: users[2].id,
      },
    ];

    for (const annotationData of annotations) {
      const existingAnnotation = await annotationRepository.findOne({
        where: {
          ownerType: annotationData.ownerType,
          ownerId: annotationData.ownerId,
          title: annotationData.title,
        },
      });

      if (!existingAnnotation) {
        const annotation = annotationRepository.create(annotationData);
        await annotationRepository.save(annotation);
        this.logger.log(
          `Created ${annotationData.ownerType} annotation: ${annotationData.title}`,
        );
      }
    }

    this.logger.log('Annotation seeding completed');
  }
}
