import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type Dictionary } from '@/get-dictionary';

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
              <div className="relative h-8 w-8 flex-shrink-0">
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

          <div>
            <h3 className="mb-6 text-lg font-semibold">
              {dictionary.pages.home.footer.product}
            </h3>
            <ul className="space-y-3 text-base">
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.features}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.pricing}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.security}
                </Button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-semibold">
              {dictionary.pages.home.footer.company}
            </h3>
            <ul className="space-y-3 text-base">
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.about}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.blog}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.careers}
                </Button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-semibold">
              {dictionary.pages.home.footer.support}
            </h3>
            <ul className="space-y-3 text-base">
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.helpCenter}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.contact}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="hover:text-primary h-auto p-0 text-base"
                >
                  {dictionary.pages.home.footer.status}
                </Button>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-12" />

        <div className="text-muted-foreground text-center text-base">
          <p>{dictionary.pages.home.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
