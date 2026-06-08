export function artworkImageFilename(imageUrl: string, artworkId: number): string {
  const segment = imageUrl.split('/').pop()?.split('?')[0]
  return segment && segment.length > 0 ? segment : `artwork-${artworkId}.jpg`
}
