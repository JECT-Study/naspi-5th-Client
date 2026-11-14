import { useInfiniteQuery } from '@tanstack/react-query';
import { feedQueries } from '@/apis/domains/feed/feed.queries';
import Button from '@/components/Button';
import FeedList from '@/components/FeedList';
import FloatingFooter from '@/components/FloatingFooter';
import { useOpenOverlay } from '@/hooks/useOverlay';
import { useRoomId } from '@/hooks/useRoomId';

// 리그 피드: 공시·뉴스 최신순, 스크롤하면 10건씩 더 불러온다 + 하단 공시 쓰기
function FeedPage() {
  const roomId = useRoomId();
  const feed = useInfiniteQuery(feedQueries.list(roomId));
  const openOverlay = useOpenOverlay();

  return (
    <>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-9 pt-2">
        <FeedList
          variant="feed"
          roomId={roomId}
          query={feed}
          empty={
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <p className="font-bold">첫 공시를 작성해 보세요!</p>
              <p className="text-sm text-gray-500">
                친구들과 소식을 나누고
                <br />
                AI 공시브리핑을 확인해 보세요.
              </p>
            </div>
          }
          // 가장 오래된 콘텐츠 아래 (리그 피드 4)
          end={
            <p className="py-8 text-center text-sm text-gray-500">
              모든 소식을 확인했어요.
              <br />
              친구들에게 새 소식을 전해보세요.
            </p>
          }
        />
        <FloatingFooter>
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
