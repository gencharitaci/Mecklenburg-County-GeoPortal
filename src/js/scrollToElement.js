/**
 * @param {{ getBoundingClientRect: () => { (): any; new (): any; top: any; }; scrollIntoView: (arg0: { behavior: string; }) => void; }} elem
 */
export default function scrollToElement(elem) {
  const top = elem.getBoundingClientRect().top
  if (
    // 'pageYOffset' is deprecated.
    top < window.scrollY ||
    top > window.innerHeight + window.scrollY
  ) {
    elem.scrollIntoView({ behavior: 'smooth' })
  }
}