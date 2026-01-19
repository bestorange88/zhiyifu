import { User, Eye } from "lucide-react";
import { useLocation } from "wouter";

interface Article {
  id: string;
  title: string;
  summary: string;
  author: string;
  views: number;
}

export function ArticleCard({ article }: { article: Article }) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/article/${article.id}`);
  };

  return (
    <div 
      className="card-elevated p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
      data-testid={`card-article-${article.id}`}
      onClick={handleClick}
    >
      <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">
        {article.title}
      </h4>
      <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
        {article.summary}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 gradient-primary rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs text-gray-500 font-medium">{article.author}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">{article.views.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
