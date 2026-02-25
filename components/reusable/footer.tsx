import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type Dictionary } from '@/get-dictionary';

interface FooterSectionProps {
  title: string;
  items: string[];
}

function FooterSection({ title, items }: FooterSectionProps) {
  return (
    <div>
      <h3 className="mb-6 text-lg font-semibold">{title}</h3>
      <ul className="space-y-3 text-base">
        {items.map((item, index) => (
          <li key={index}>
            <Button
              variant="ghost"
              className="hover:text-primary h-auto p-0 text-base"
              disabled
            >
              {item}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FooterProps {
  dictionary: Dictionary;
}

export function Footer({ dictionary }: FooterProps) {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src="/logo.png"
                  alt={dictionary.brand.logoAlt}
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <span className="text-xl font-bold">{dictionary.brand.name}</span>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">
              {dictionary.pages.home.footer.tagline}
            </p>
          </div>

          <FooterSection
            title={dictionary.pages.home.footer.product}
            items={[
              dictionary.pages.home.footer.features,
              dictionary.pages.home.footer.pricing,
              dictionary.pages.home.footer.security,
            ]}
          />

          <FooterSection
            title={dictionary.pages.home.footer.company}
            items={[
              dictionary.pages.home.footer.about,
              dictionary.pages.home.footer.blog,
              dictionary.pages.home.footer.careers,
            ]}
          />

          <FooterSection
            title={dictionary.pages.home.footer.support}
            items={[
              dictionary.pages.home.footer.helpCenter,
              dictionary.pages.home.footer.contact,
              dictionary.pages.home.footer.status,
            ]}
          />
        </div>

        <Separator className="my-12" />

        <div className="text-muted-foreground text-center text-base">
          <p>{dictionary.pages.home.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
