import { useInfiniteQuery } from '@tanstack/react-query';
import { feedQueries } from '@/apis/domains/feed/feed.queries';
import Button from '@/components/ui/Button';
import ErrorIllustration from '@/components/ui/ErrorIllustration';
import FeedList from '@/components/feed/FeedList';
import FloatingFooter from '@/components/ui/FloatingFooter';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { useRoomId } from '@/hooks/useRoomId';

// 리그 피드: 공시·뉴스 최신순, 스크롤하면 10건씩 더 불러온다 + 하단 공시 쓰기
function FeedPage() {
  const roomId = useRoomId();
  const feed = useInfiniteQuery(feedQueries.list(roomId));
  const openOverlay = useOpenOverlay();

  return (
    <>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <FeedList
          variant="feed"
          roomId={roomId}
          query={feed}
          // 콘텐츠 없음 (시안 '공시 없는 피드 안내'): 남은 영역 가운데, 좌우 24·아래 20
          // 마스코트 → 18 → 제목 Heading3 + 8 + 설명 Body1.5 (모두 Grey/7, 가운데 정렬)
          empty={
            <div className="flex flex-1 flex-col items-center justify-center gap-4.5 px-6 pb-5 text-center">
              <ErrorIllustration />
              <div className="flex flex-col gap-2 text-grey-7">
                <p className="text-heading3">첫 공시를 작성해 보세요!</p>
                <p className="text-body1-5">
                  친구들과 소식을 나누고
                  <br />
                  AI 공시브리핑을 확인해 보세요.
                </p>
              </div>
            </div>
          }
          // 가장 오래된 콘텐츠 아래 (리그 피드 4). 시안 '피드끝': 흰 카드(여백 12)에 Caption1 Grey/8 한 줄
          end={
            <p className="bg-white p-3 text-caption1 text-grey-8">
              모든 소식을 확인했어요. 친구들에게 새 소식을 전해보세요.
            </p>
          }
        />
        <FloatingFooter className="px-4.5">
          <Button
            className="w-full"
            onClick={() => openOverlay({ type: 'disclosureCreate', roomId })}
          >
            공시 쓰기
          </Button>
        </FloatingFooter>
      </main>
    </>
  );
}

export default FeedPage;
