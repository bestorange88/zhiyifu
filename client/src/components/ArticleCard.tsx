import { User, Eye } from "lucide-react";

interface Article {
  id: string;
  title: string;
  summary: string;
  author: string;
  views: number;
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 hover:shadow-md hover:border-blue-100 transition-all duration-300 cursor-pointer group">
      <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">
        {article.title}
      </h4>
      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
        {article.summary}
      </p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs text-gray-500 font-medium">{article.author}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Eye className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{article.views.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
